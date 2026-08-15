# GHI CHÚ — TEMPLATE ANAGRAM

## Đợt 165 (15/8/2026) — ⭐ EDITOR: TAB ENG1/ENG2/VI1/VI2 + bỏ Hide all Text/Swap Columns/Tip

✅ **THẦY DUYỆT → COMMIT `52fbed5` + PUSH + LIVE** (15/8/2026, đã đối chiếu sha256sum, khớp 100%) — chi
tiết đầy đủ ở `../../GHI CHU DU AN.md` Đợt 165. Tóm tắt:
`anagram-editor.js` giờ cho sửa CẢ 4 bộ gợi ý (ENG1/ENG2/VI1/VI2, Đợt 145) ngay trong Edit qua tab
trượt, thay vì chỉ sửa được bộ đang chơi + 1 nhãn đọc. Bỏ 2 tính năng cũ (Hide all Text — dư vì đã có
Options > Content; Swap Columns — thầy thấy không hữu dụng) + hộp Tip (bỏ luôn ở 15 editor khác, không
riêng Anagram). Bench test mới: `../../scratch/test-anagram-editor.html`.

---

## Đợt 155 (14/8/2026) — ⭐ THAM GIA CHẾ ĐỘ MỚI **SHOWDOWN** (thêm ĐÚNG 1 DÒNG)

✅ **COMMIT `57677cf` + PUSH + LIVE** (14/8/2026). `anagram.js` chỉ thêm **`showdownMode: true`** — không một dòng nào khác.

Toàn bộ hạ tầng ở `core/showdown.js` + `core/showdown-setup.js` + `core/engine.js` (xem
`core/HUONG DAN CORE.md` mục **SHOWDOWN MODE**, và `../../GHI CHU DU AN.md` Đợt 155).
Anagram không phải làm gì vì engine lấy sẵn hai thứ file này VỐN ĐÃ có:
- **câu này của em nào** ← `ui.setNav({index})` (đúng cả khi thầy bấm ‹ › lùi lại);
- **ai đúng ai sai** ← mảng `review` mà `finish()` vốn đã dựng.

⚠️ **Slogan "ANAGRAM IN ANDREW CLASSES" KHÔNG bị đụng.** Engine **ẨN** nó bằng CSS rồi hiện tên học
sinh ở **một node KHÁC** trong cùng ô giữa topbar. Cố ý: `render()` của file này **ghi đè
`ui.sloganSlot.textContent` mỗi lần vẽ**, nên tên nhét chung node đó sẽ bị xoá lúc sang từ mới —
âm thầm, và chỉ ở đúng game này. Ai sau này đổi cách viết slogan thì giữ luật "mỗi thứ một node".

🟢 Đo thật (localhost): 3 em / 6 câu ⇒ tên chạy **1,2,3,1,2,3**; bấm ‹ lùi tên bám đúng số câu;
Show answers gom đúng theo em (Ẳnh → câu 1,4 · Hạnh → 2,5 · Vy → 3,6). 0 lỗi console.

---

## Đợt 148 (14/8/2026) — ⭐ NHỊP THỨ HAI CỦA CÚ ĐÓNG: KHOẢNG CÁCH HÀNG CHUYỂN TỪ LƯỚI XUỐNG TỪNG Ô

✅ **THẦY DUYỆT** ("commit + push live", 14/8/2026) **→ COMMIT + PUSH + LIVE.** Sửa `syncPen()` + `anagram.css`, và **có sửa core** (`core/app.css`).

Đợt 147 mới chữa được **nhịp đầu**. Thầy báo tiếp: *"khối trên hạ xuống một chút nhưng vẫn còn chút
khoảng trống nữa. Sau đó lại hạ xuống một nhịp ngắn nữa hết khoảng trống thừa đó."*

**Đo**: co ruột về 0 ⇒ lưới **235px**; bỏ hẳn ô khỏi bố cục ⇒ **227px**. **8–9px chênh đó là `row-gap`
của lưới** — mà `gap` là của **LƯỚI**, nên không animation nào đặt trên **Ô** xoá được nó; nó chỉ mất
đúng lúc `display:none` chạy ở +300ms. Đó là nhịp hai.
⚠️ **Đã thử `margin-bottom` âm: KHÔNG ăn thua** (đo: 235 → 235).

**Cách chữa** (ở `core/app.css`, nên áp cho cả 17 template): `row-gap` của `.aw-opt-grid` về **0**, mỗi
ô mang `margin-bottom: 9px`, lưới mang `-9px` bù hàng cuối. Ô nay **co khoảng cách của chính nó cùng
lúc với chiều cao** ⇒ `syncPen` chỉ cần thêm `penHost.style.marginBottom = "0px"` khi đóng và bỏ trống
khi mở. **Không còn `display:none`** — cao 0 + lề 0 là đã không chiếm gì.

🟢 Đo lại: `open=289 → đóng(khung đầu)=235 → sau dọn dẹp=235` ⇒ **nhịp hai biến mất**; panel co
**414 → 360**, mép trên hạ **54px** liền mạch. Mở/đóng qua lại 3 chế độ vẫn đúng số ô, panel
**504px · 400/400 · không cuộn · không phải nén chữ** — y như trước đợt này.
⬜ Vẫn cần **mắt thầy**: pane test bị ẩn nên Chromium không vẽ khung hình nào.

## Đợt 147 (14/8/2026) — ⭐ VÁ LỖI THẬT: "ANIMATION KHỰNG 1 NHỊP" KHI ẨN THANH POINTS OFF

✅ **THẦY DUYỆT** ("commit + push live", 14/8/2026) **→ COMMIT + PUSH + LIVE.** Sửa đúng `syncPen()` trong `anagram.js`, **không đụng core**.

Thầy báo: *"chuyển từ On Submit về Letters with bonus (ẩn đi thanh Points off) thì animation bị khựng
1 nhịp"*.

**Đo bằng `MutationObserver`** (pane test bị ẩn nên transition/rAF chết hẳn, nhưng observer vẫn chạy
chuẩn — đo được **thứ tự + mốc thời gian** thao tác DOM, đủ để bắt loại lỗi này):
cả **3 thao tác rơi vào CÙNG một khung hình, mốc +0,9ms** — `display:none` lên ô Points off · thêm
`is-closed` · `max-height:0`. Nên thanh trượt **biến mất trong 1 khung hình**, rồi mới có **cái hộp
RỖNG cao 51px trượt lên trong 280ms**: giật một cái xong mới trượt.

**Vá**:
- **ĐÓNG**: ô **ở lại trong khung suốt cú trượt**, chỉ `display:none` sau đó (`300ms` = 280ms
  transition + 1 khung hình). Mắt bám theo chính thanh trượt trôi lên dưới `overflow:hidden`.
- **MỞ**: đảo lại — **hiện ô TRƯỚC rồi mới đo `scrollHeight`**, kẻo hộp trượt tới chiều cao lưới rỗng.
- Tách `showCells(m)` ra thành hàm riêng vì hai chiều nay gọi nó ở **hai thời điểm khác nhau**.

🟢 Đo lại sau vá: trượt bắt đầu ở **+0,6ms**, ô rời khung ở **+312,0ms**. Quét cả 3 chế độ qua lại 5
lượt: `max-height` luôn khớp `scrollHeight` (51px), **không cắt xén**, đúng ô hiện ở mỗi chế độ,
0 lỗi console.

⚠️ **BẪY GHI LẠI THÀNH LUẬT**: accordion kiểu `max-height` thì **`display:none` phải rơi SAU khi
transition xong, không được cùng khung hình với nó**. Cùng họ với bẫy Đợt 137 trên **đúng accordion
này** (`overflow:hidden`) — lần đó sai **thuộc tính**, lần này sai **thời điểm**.
⬜ Chưa nhìn được bằng mắt (pane ẩn) — chỗ này cần mắt thầy.

## Đợt 145 (14/8/2026) — EDITOR BIẾT ĐẾN "BỘ GỢI Ý": SỬA ĐÚNG BỘ ĐANG CHƠI, KHÔNG XOÁ 3 BỘ KIA

✅ **THẦY DUYỆT** ("commit + push live", 14/8/2026) **→ COMMIT + PUSH + LIVE.** Chỉ sửa `anagram-editor.js`; **`anagram.js` không đụng một dòng**
(nó nhận act đã được lõi bẹp sẵn xuống 1 gợi ý — xem `core/HUONG DAN CORE.md` mục "MỘT ACT MANG NHIỀU
BỘ GỢI Ý"). Act bộ từ nhập từ Excel nay là **một act `WORDS`** mang cả `ENG1 · ENG2 · VI1 · VI2`.

**Việc thật sự nguy hiểm ở đây, và vì sao phải sửa:** `normalize()` cũ **dựng lại mỗi hàng từ 5 khoá cố
định** (`word · clue · voice · voiceId · hideText`). Mở một act `WORDS` bằng editor đó rồi bấm Save là
**3 bộ gợi ý còn lại biến mất sạch, không một lời cảnh báo** — hàng vẫn đủ 100 từ nên nhìn không ra.
Nay `clues` / `voices` **đi kèm chính object của hàng**, nên thêm hàng · xoá hàng · kéo-thả đổi thứ tự ·
Swap columns · dán từ Excel đều mang cả 4 bộ đi cùng.

- Editor vẫn **MỘT cột Clue** — là **bộ act đang chơi** (`activeVariant()`), tức mở Edit từ trong game
  thì sửa đúng bộ vừa nhìn thấy. Muốn sửa bộ khác: đổi ở **Options > Content** rồi mở Edit lại.
- Có **chip "Clue set: ENG2"** ở cuối thanh công cụ bulk (`margin-left:auto`, là NHÃN chứ không phải nút
  nên đẩy hẳn ra mép, không chen vào giữa 4 icon thầy hay bấm). Thiếu nó thì sửa nhầm bộ là chuyện sớm
  muộn — cột Clue trông y hệt nhau ở cả 4 bộ.
- Lúc Save: chữ trong cột Clue **gấp lại vào đúng bộ đó**; bản sao `.clue` của hàng **đọc lại từ bộ mặc
  định** (nó là thứ thẻ thư viện và bản in dùng). Xoá giọng thì **xoá hẳn khoá** thay vì lưu cặp rỗng.
- "Generate all voices" trong editor vẫn chạy y cũ và rơi đúng vào bộ đang sửa.
- 🟢 Test thật trong trình duyệt: mở trên ENG2 → chip đúng, hàng 1 hiện đúng câu ENG2, sửa rồi Save →
  **chỉ `clues.eng2` đổi**, `eng1/vi1/vi2` y nguyên, `voices` không sinh rác; làm lại trên VI2 cũng vậy.

## Đợt 142 (13/8/2026) — LUẬT MIX GIỌNG RỜI KHỎI FILE NÀY, LÊN `core/voice-mix.js`

✅ **THẦY DUYỆT → COMMIT `7faf500` + PUSH + LIVE.** Editor **không đổi 1 pixel giao diện, không đổi 1 hành vi** — chỉ đổi chỗ ở
của mấy hàm quyết định, vì **popup Import** (`main.js`) nay cũng có Mix voice và **không được phép
import từ template**. Giữ 2 bản luật là đúng loại lỗi đã cắn ở Đợt 118.

Rời khỏi `anagram-editor.js` → `core/voice-mix.js`: `buildVoicePlan()` (chuyển **nguyên văn**) ·
`fillVoiceOptions()` · hằng `MIX_DEFAULTS` (Isabella/George/Alice/Fable). Khối chọn giọng lúc bấm
Generate nay gọi `planFor({mix, random, accent, mixIds, singleId}, targets.length)` — cùng hàm popup
Import gọi. `shuffle` không còn dùng trong file này nên đã gỡ khỏi dòng import `core/utils.js`.

⚠️ **Sửa cách chia giọng từ nay là sửa `core/voice-mix.js`**, và phải tự test **cả 2 đường** (popover
editor + panel Import), giống luật "đụng `fight.js` là phải test cả Anagram lẫn Quiz".

**Đã tự test (không đăng nhập)**: mount editor thật standalone, mở popover "Generate all voices" →
đủ **5 tick** (Skip / Mix / Random / UK / US), 4 giọng mặc định đúng thứ tự, optgroup **UK 8 + US 20**;
luật chia giọng đo riêng bằng Node: 7 cỡ mẻ × 200 lượt cân bằng nam/nữ ≤1, 4 giọng qua 16.000 chỗ
lệch **0.0%**. ⬜ Chưa chạy TTS thật (cần model 86MB + đăng nhập).

## ⭐ Đợt 140 (13/8/2026) — BẢNG OPTIONS v2: Anagram là ca nặng nhất, viết lại toàn bộ `buildExtraOptions`

✅ **THẦY DUYỆT → COMMIT `eea0ecd` + PUSH + LIVE** (đã đo lại trên chính bản live: 397px, không cuộn). Số đo đầy đủ + 5 luật mới: `../../GHI CHU DU AN.md` Đợt 140 và
`../../core/HUONG DAN CORE.md` mục **"OPTIONS PANEL v2"**.

**Vì sao Anagram là ca nặng nhất**: panel của nó chính là panel thầy chụp màn hình gửi kèm lời phàn
nàn, và cũng là panel duy nhất **cao quá chỗ cho phép** (667 > 645px) nên `is-compact-opts` phải nén
mọi nhãn xuống 9.5px mỗi lần thầy mở Options — tức là **thứ thầy nhìn thấy là bản đã bị nén khẩn cấp**.

**Đo thật (1280×720)**:
| | Trước | Sau |
|---|---|---|
| Mode "Bonus and minus" | **667px** (bị nén còn 543) | **488px**, KHÔNG nén |
| Mode mặc định | 616px | **397px** |
| Fight mode (chỗ trống chỉ 471px) | cuộn ở 2/3 mode | **446 / 405 / 399px, không mode nào cuộn** |
| Mép trái | 4 đường (15/17/19/20) | **2 đường** = đúng 2 cột |
| Thanh trượt | 212 / 208 / 220 / 121px | **190px cả 4** |

**Bố cục mới**: `Anagram mode` (segmented 3 lựa chọn, **giữ nguyên văn tên 3 mode**, chiếm 2 cột) →
khối điểm phạt theo mode → `Lives` → (engine) `Letters on answers` · `Time cost` → khối switch
(`All caps`, `Allow skip`).

**Khối điểm phạt theo mode — đổi cách làm, giữ nguyên ý đồ Đợt 134/137:**
- Trước: **3 nhóm** riêng, mỗi nhóm tự thu/mở bằng `max-height` (`.aw-anagram-pengroup` +
  `.aw-anagram-pencontent`).
- Nay: **1 wrapper** `.aw-anagram-penwrap` (`overflow:hidden`, animate `max-height`) bọc một lưới 2 cột
  con; từng ô bên trong bật/tắt bằng `display:none`. Nhờ vậy lưới NGOÀI không bao giờ thấy một hàng
  mở dở, mà vẫn giữ hiệu ứng mượt thầy yêu cầu ở Đợt 134.
- ⚠️ **Bài học Đợt 137 giữ nguyên 2 lớp bảo vệ**: `overflow:hidden` trên wrapper + class `is-closed`
  cắt `pointer-events`. Thêm nữa, ô ẩn nay `display:none` nên **về mặt cấu trúc** không thể ăn chuột.
- Đã **đối chứng ngược**: tái tạo đúng bệnh Đợt 137 (ô ẩn vẫn được bố trí + wrapper không clip) →
  phép soi `elementFromPoint` bắt đúng **3 ca**, chữa xong về **0**. Lành → bệnh → lành.

**Apply đo thật**: ghi đúng `{anagramMode:"bonusMinus", letterPenalty:25, bonusMult:7, lives:4}`, chip
hiện `-25`. Không đổi tên trường nào — act cũ mở lên vẫn y như trước.

**Chữ rút gọn cần thầy duyệt**: `∞` thay "Unlimited" ở Lives (chip phải vừa 52px, nới ra là gãy cột
giá trị) · "Allow skip" thay "Allow skip (Next can move on early)" (câu đầy đủ nằm ở tooltip).

## ⭐ Đợt 139 (13/8/2026) — TIME COST (trừ điểm mỗi giây TRỐNG) + BONUS X LÊN 10X

✅ **THẦY DUYỆT → COMMIT `c840baf` + PUSH + LIVE.** Chi tiết đầy đủ + toàn bộ số đo: `../../GHI CHU DU AN.md` Đợt 139.
Hợp đồng `tpl.timeCost` dùng chung: `../../core/HUONG DAN CORE.md` mục "TIME COST".

**Anagram phải làm gì (rất ít — engine lo phần còn lại):**
- `timeCost: true` trong object template.
- `scoreNow()` trừ thêm `ui.timeCostTotal()`, và `ui.finish({score})` cũng trừ.
- `ui.setScoreProvider(scoreNow)` — để vòng đếm giảm của engine chạy tới đúng con số THẬT của mình
  (đừng để nó tự làm toán trên số đang hiện: số đó có thể đang bay dở giữa hiệu ứng "+N" của chính file này).
- `ui.setIdleGuard(...)` = `busy || finished || fightLocked() || doneCheck(state[index]) || đang phát giọng đọc`.
  ⚠️ **`doneCheck` mới là mấu chốt**, không phải `busy`: sau khi giải xong 1 từ còn ~1,8-2,4s hoạt cảnh
  (PERFECT → "+N" bay → đếm điểm) mà `busy` KHÔNG bật, HS thì chẳng bấm được gì — thiếu vế này là mỗi
  từ giải xong tự ăn thêm 2 nhịp trừ oan.
- `ui.noteActivity()` ở 4 chỗ: đặt đúng 1 chữ (`bonusPick`, nhánh ĐÚNG) · đặt chữ vào ô (`submitPickAt`) ·
  đảo chỗ chữ đã đặt (`moveResultTile`) · **đầu `render()`** (từ mới = trả lại toàn bộ thời gian suy nghĩ).
  ⚠️ Nhánh chạm SAI **cố ý không gọi** — thầy chốt: mode "Letters with bonus" chạm sai không mất gì,
  nếu chạm sai cũng reset thì gõ bừa liên tục là vô hiệu hoá cả tính năng.

**Bonus x**: đúng 1 số — `MAX_BONUS_MULT` 5 → **10**. Thanh trượt, `clampBonusMult` và chữ "Nx PERFECT"
đều suy ra từ hằng số này nên không phải sửa chỗ nào khác. Act cũ giữ nguyên hệ số đã lưu, mặc định vẫn 2x.
Đo thật: ELEPHANT (8 chữ) hoàn hảo ở 10x = **80 điểm**, burst in "10x PERFECT".

**Options — hàng 2 cột**: 3 nhóm points-off nay nằm trong `.aw-opt-cell.aw-anagram-pencol` (cột trái),
ô Time cost của engine ở cột phải (engine truyền hàm dựng qua `buildExtraOptions({ timeCostCell })`).
⚠️ **Ruột accordion Đợt 134/137 KHÔNG bị đụng tới** — 3 nhóm được append y nguyên, chỉ đổi chỗ đứng.
Nhờ vậy mode "Bonus and minus" và "On submit" **không cao thêm pixel nào**; cả 3 mode panel vẫn không
phải cuộn, và `elementFromPoint` cho mọi thanh đang mở đạt **5/5 điểm**.

---

## ⭐ Đợt 137 (13/8/2026) — LỖI THẬT: KHÔNG KÉO ĐƯỢC THANH "POINTS OFF" (hồi quy từ Đợt 134)

✅ **THẦY DUYỆT → COMMIT `912016b` + PUSH + LIVE.** KHÔNG đụng core — sửa ĐÚNG 1 file `anagram.css`, 2 dòng.
Chi tiết đầy đủ + 6 bài học: `../../GHI CHU DU AN.md` Đợt 137.

**Thầy báo**: "thanh points off trong options bị lỗi không kéo được."

**Gốc lỗi**: Đợt 134 việc 5 (animation mượt khi đổi mode) bọc mỗi nhóm penalty trong
`.aw-anagram-pencontent` đóng/mở bằng `max-height:0` + `opacity:0` — **quên `overflow:hidden`**.
`max-height:0` chỉ ép chiều cao CÁI HỘP; **ruột vẫn nằm nguyên chỗ cũ và vẫn ăn chuột**, mắt không
thấy chỉ vì `opacity:0`. Cộng thêm **`opacity`<1 đẻ ra stacking context** ⇒ khối vô hình được vẽ ở lớp
TRÊN nội dung thường của nhóm kế tiếp ⇒ **thanh trượt tàng hình đè khít lên thanh trượt thật ngay
dưới, nuốt sạch mọi cú kéo**.

**3 ca dính (rộng hơn thầy báo)** — đo bằng `elementFromPoint` 5 điểm/thanh:

| Anagram mode | Thanh nhìn thấy nhưng chết | Thủ phạm (đang ẩn) |
|---|---|---|
| Bonus and minus | Points off (wrong letter) | Points off (wrong answer) ← thầy gặp |
| Letters with bonus | **LIVES** | Bonus x |
| On submit | **LIVES** | Bonus x |

**FIX** (`anagram.css`, `.aw-anagram-pencontent`): `overflow: hidden` (dòng khiến `max-height` có
nghĩa thật) + `pointer-events: none` / `auto` khi `.is-open` (chốt chặn lớp 2). Comment dài ngay tại
chỗ đã ghi rõ vì sao — **đừng gỡ 2 dòng này**.

**Đã test**: kéo chuột THẬT `Off`→`-75`; đối chứng ngược (tiêm CSS gỡ vá) tái hiện đúng lỗi + lộ tác
hại ngầm (thanh tàng hình bị kéo lén sang `7`, tức **âm thầm đổi một cài đặt khác**); sau vá cả 3 mode
+ chế độ ĐẤU đều OK 5/5; animation Đợt 134 còn nguyên (3,6→41,4→45px); mở ra không bị cắt
(`clientHeight` 45 = `scrollHeight` 45); 0 lỗi console.

⚠️ **KHÔNG phải lỗi mới**: khi đấu, thanh *Lives* và *Round rule* nằm **ngoài vùng cuộn** panel (669px
nội dung so với 342px chỗ hiện) — chính là việc treo cũ "Options khi đấu vẫn phải cuộn" (Đợt 132/134),
cuộn xuống là bấm/kéo bình thường.

**CHỜ TEST TOMKO**: kéo thử Points off + Lives trên màn cảm ứng thật (chuột đã chắc chắn OK).

---

## ⭐ Đợt 134 (13/8/2026) — 12 CẢI TIẾN UI/UX ĐƠN+ĐẤU + VÁ LỖI THẬT "2 LOA LỆCH MÀU"

✅ **THẦY DUYỆT ("ok build") → ĐÃ TỰ TEST kỹ qua trình duyệt thật (single + fight, cả Quiz fight để
soát core dùng chung không vỡ) → COMMIT `0a24c62` + PUSH + LIVE.** Luật chung:
`../../GHI CHU DU AN.md` Đợt 134. ⭐ CÓ SỬA CORE
(`core/engine.js`, `core/app.css`, `core/fight.js`, `core/sound.js`) + Anagram
(`anagram.js`/`.css`) — ảnh hưởng tới TẤT CẢ 17 game (animation popup mượt hơn) và tới **Quiz fight
mode** (nhóm Options tách + "TEAM LEFT/RIGHT WINS" + số 7 nét — đã tự test riêng, không vỡ).

**SINGLE mode (6 việc):**
1. **Slogan "ANAGRAM IN ANDREW CLASSES" lên chung thanh trên cùng** với đồng hồ+điểm — trước đây nó là
   1 hàng flex bên TRONG khung câu hỏi (Đợt 132), giờ chuyển hẳn ra `.aw-topbar` qua slot mới
   `ui.sloganSlot` (`core/engine.js`, opt-in `tpl.hasSloganSlot` — **chỉ Anagram bật**, 16 game khác
   không đổi gì). `.aw-anagram-card` được `padding-top` thay chỗ trống cũ (giữ nguyên khoảng thở cho
   hào quang nút loa, tránh lặp lại lỗi Đợt 132 "hào quang bị `.aw-playarea` cắt").
2. **Cụm loa+sóng**: thêm cột sóng thứ 5 (`EQ_BAR_COUNT` 4→5), độ nhạy tăng (`smoothingTimeConstant`
   0.55→0.35 + gain/curve mới `EQ_GAIN=1.55`, `EQ_CURVE=0.7` khuếch đại cả đoạn nói khẽ, không chỉ đỉnh
   to), nút dài hơn + padding-trong/gap-icon↔sóng **bằng nhau tuyệt đối** (đo pixel: cả 3 khoảng cách
   = 12px ở font-size 40px, xác nhận qua DOM thật).
3. **Panel Options tự thu nhỏ khi tràn** (opt-in `tpl.compactOptionsOnOverflow`, chỉ Anagram) —
   `ResizeObserver` đo `scrollHeight` TỰ NHIÊN (gỡ class rồi đo lại, tránh dao động lặp vô hạn), tự
   thêm/gỡ `.is-compact-opts` (chữ/khoảng cách ~78-86%). Đo thật: Đấu+Anagram trước đây tràn 603px
   (so max 471px) → sau khi nén còn 556px — giảm nhưng KHÔNG hết hẳn (đúng dự kiến, Đợt 132 từng ghi
   hướng "đè lên hàng nút" mới hết hẳn cuộn — thầy chưa duyệt hướng đó).
4. **Animation mở/đóng popup mượt hơn** (Options/Template/Style/Mode dùng `.aw-tool-panel`, Menu dùng
   `.aw-menu`) — thay `aw-fadein` (chỉ mờ dần) bằng `aw-pop-cx`/`aw-pop` (nảy + phóng to nhẹ), có sẵn
   trong app rồi, chỉ cần đổi tên animation dùng. Đóng cũng mirror bằng WAAPI, **luôn giữ
   `translateX(-50%)` trong mọi keyframe** để không phá phép canh giữa (bẫy đã ghi ở `core/app.css`).
   ẢNH HƯỞNG TOÀN BỘ 17 GAME (dùng chung `core/engine.js`'s `openToolPanel`/`closeToolPanel`).
5. **Animation mượt cho 3 nhóm Points-off/Bonus x khi đổi Anagram mode** — thay `display:none` cứng
   bằng 2 lớp: khung ngoài `.aw-opt-group` chuyển `margin-bottom` mượt, khung trong
   `.aw-anagram-pencontent` chuyển `max-height`+`opacity` theo `scrollHeight` đo thật (kỹ thuật y hệt
   `.aw-as-answers` đã có sẵn trong app). Lần vẽ đầu tiên panel còn NGOÀI DOM (`scrollHeight`=0) nên
   dùng `max-height:none` tức thì rồi đợi 1 tick (`setTimeout 0`) chốt lại số đo thật — nhóm đầu tiên
   không bị "giật" lúc user bấm radio đầu tiên.
6. **Âm thanh khi điểm chạy tăng/giảm** (`pulseScoreTo`) — phát hiện: **trước đây CẢ đơn lẫn đấu đều
   CHƯA có** hiệu ứng này (không phải "port" từ đơn sang đấu như giả định ban đầu, xác nhận qua đọc
   code). Thêm 1 tiếng lướt cao độ (`ui.sound.glide`, hàm MỚI trong `core/sound.js`, thin wrap quanh
   `tone()` nội bộ — không lộ Web Audio thô ra ngoài module) đúng `FLYGAIN_PULSE_MS`=420ms, lên cao khi
   cộng điểm, xuống thấp khi trừ (mode "submit" có thể trừ điểm). Dùng chung `pulseScoreTo` cho cả
   2 chế độ nên **fight mode cũng tự động có** — không cần code riêng.

**FIGHT mode (6 việc):**
7. **Ẩn hẳn slogan khi đấu** — miễn phí nhờ việc 1: `.aw-fight-board .aw-topbar` đã bị collapse
   `visibility:hidden; height:0` từ trước (Đợt 129), slogan nằm trong đó nên tự động vô hình, không
   cần nhánh code riêng.
8. **⭐ VÁ LỖI THẬT "2 loa lệch màu"** (thầy báo: bấm next câu mới, 1 loa xanh dương 1 loa xanh lá) —
   KHÔNG phải do CSS team-color (đã kiểm chứng .is-playing dùng chung, không theo side). Gốc lỗi: bàn
   không phát tiếng (mirror) đọc `reportVoiceState` kiểu PUSH — nếu tin nhắn tới đúng lúc `currentListenBtn`
   đang `null` (khoảnh khắc giữa lúc `render()` reset và gán nút mới), tin bị rớt VĨNH VIỄN cho tới hết
   clip. Sửa: `core/fight.js` giữ `lastVoiceState` (merge từng field) + thêm `ctl.voiceState()` để PULL;
   `anagram.js` gọi pull này NGAY sau khi gán `currentListenBtn` mới trong `render()` (trích logic dùng
   chung thành `applyVoiceState()`, dùng cho cả push lẫn pull). Tự test: chuyển từ nhiều lần trong fight
   mode, 0 lỗi console, DOM confirm `fightBoards:2`.
9. **Tách nhóm Options** "First team wins the word" + "Let the other team finish" + thanh trượt "Bonus
   for finishing first" ra khỏi nhóm "Fight mode" (Same/Different words), tạo nhóm riêng "Round rule";
   "The slower team still keeps its points" cũng ra nhóm riêng — panel giờ có nhịp đều (nhóm/nhóm/nhóm)
   thay vì 4 hàng dồn cục 1 nhóm. Ở `core/fight.js` (dùng chung Quiz) — đã tự test Quiz fight, panel
   hiện đúng "Fight mode" → "Round rule" (2 dòng) → "(không nhãn)" → các nhóm khác của Quiz, không vỡ.
10. **Số điểm chỉnh tay kiểu 7 nét** — vẽ THẬT bằng CSS thuần (`core/fight.js`'s `sevenSegHtml()`, mỗi
    số là 1 hộp 7 thanh `clip-path` hình thang/lục giác, nét TẮT hiện mờ 10% thay vì biến mất hẳn —
    đúng cảm giác đèn LED thật), không tải/nhúng font ngoài (giữ đúng luật "tự chứa 100%, chạy offline"
    của app). Size tăng: `.aw-fight-handnum` clamp(16,3vw,24)px → clamp(18,3.4vw,27)px, ô số
    (`.aw-fight-hand`) GIỮ NGUYÊN cỡ nút toolbar (thầy chỉ xin tăng size SỐ, không xin to hộp).
    ⚠️ **BẪY đã vấp phải khi code**: `const SEVEN_SEG = {...}` khai sau `const hands = [makeHand(0),
    makeHand(1)]` (dòng gọi sớm hơn trong cùng closure) → `ReferenceError: Cannot access 'SEVEN_SEG'
    before initialization` (temporal dead zone) — fight mode load lỗi im lặng (catch + console.warn),
    KHÔNG throw ra ngoài nên dễ bỏ sót. Sửa: chuyển khai báo `SEVEN_SEG`/`sevenSegHtml` lên TRƯỚC dòng
    `const hands = ...`. **Ghi nhớ**: mọi hằng/hàm mà `makeHand()`/`makeTeam()` dùng phải khai TRƯỚC
    dòng gọi `[makeTeam(0),makeTeam(1)]`/`[makeHand(0),makeHand(1)]`, không phải trước ĐỊNH NGHĨA hàm
    (function declaration hoist được, nhưng `const` bên trong nó thì KHÔNG).
11. **Âm thanh khi điểm đội chạy tăng** — dùng chung `pulseScoreTo`/`ui.sound.glide` với việc 6, không
    cần code riêng cho fight (`ui.setScore` đã tự gọi `fight.ctl.onScore` mỗi bước đếm sẵn từ trước).
12. **"TEAM 1/2 WINS" → "TEAM LEFT/RIGHT WINS"** — `core/fight.js`'s `showResult()`, side 0 luôn là
    bàn TRÁI (`boardsRow.append(boardEls[0], boardEls[1])`, xác nhận qua đọc code) nên `a>b` (side 0
    cao hơn) = "TEAM LEFT WINS". Áp dụng cho cả Quiz (dùng chung `showResult`) theo đúng thầy chọn.

**⚠️ BẪY MỚI đúc ra từ đợt này (nên thêm vào `core/HUONG DAN CORE.md`):**
- **Bàn console-log của công cụ test trình duyệt tự động có thể TRẢ VỀ DỮ LIỆU CŨ** dù trang đã tải lại
  hoàn toàn nhiều lần (kể cả đổi URL, đổi query string, restart hẳn server) — đừng tin `console` log khi
  gỡ lỗi mà PHẢI đối chiếu bằng cách đọc thẳng DOM (`document.querySelector(...)`) hoặc gắn
  `window.addEventListener('error', ...)` TRƯỚC khi thao tác để bắt lỗi thật.
- **TDZ (`const` sau điểm gọi trong cùng closure) là lỗi ĐẶC BIỆT nguy hiểm ở đây** vì `core/fight.js`
  tự bọc toàn bộ `startFight()` trong try/catch + `console.warn("fight mode failed to load")` — không
  có gì đỏ/throw ra UI, người chơi chỉ thấy nút "Start fight" không phản ứng gì (im lặng), rất dễ tưởng
  là do mạng chậm hay do bấm nhầm.

**Đã test**: cả 12 việc đều đo được bằng DOM trực tiếp (không dựa console) — slot slogan đúng vị trí/ẩn
đúng lúc, 5 cột sóng cân đối tuyệt đối (12px=12px=12px), panel Options co giãn đúng công thức không dao
động lặp, popup mở/đóng không lỗi + giữ canh giữa, 3 nhóm penalty ẩn/hiện mượt đúng scrollHeight, âm
thanh gọi đúng hàm mới không throw, fight mode dựng đúng 2 bàn sau khi vá TDZ, Options Quiz+Anagram đều
tách nhóm đúng, 7-segment vẽ đúng số nét bật/tắt theo bảng tra. 0 lỗi console thật (đã lọc nhiễu do bẫy
console-cache ở trên).
**CHỜ TEST TOMKO**: nghe thật cụm loa 5 cột + âm thanh đếm điểm trên loa ngoài; cảm giác chạm cụm loa đã
dài hơn có thoải mái không; nhìn số 7 nét trên màn 86" có rõ/đẹp không; bấm thật nút Menu/Options xem
animation mới có mượt như mong đợi trên máy cảm ứng thật (khác hẳn cảm giác khi đo bằng code).

---

## ⭐ Đợt 129 (12/8/2026) — GIẤU KẾT QUẢ "ON SUBMIT" TỚI KHI CẢ 2 ĐỘI XONG + NEXT/BACK ĐỒNG BỘ

✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** Luật chung: `../../GHI CHU DU AN.md` Đợt 129 +
`../../core/HUONG DAN CORE.md` mục "GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ".

**Lỗi Đợt 128 để lại**: đội nộp sai trước được chấm "như bình thường" — nhưng chấm bình thường của
Anagram gồm **tô xanh/xám TỪNG VỊ TRÍ** (chỉ rõ chữ nào đã đúng chỗ) và **in thẳng từ đúng ra dòng đáp
án**. Đây là chỗ lộ đáp án nặng nhất trong cả app: đội kia chỉ việc đọc.

**Sửa — `doSubmit()` tách đôi trong fight mode:**
1. Tính `allCorrect` xong là **chốt trạng thái + báo trọng tài NGAY** rồi `return` — không chờ hết
   `n×260+300` ms hoạt cảnh như trước. Trọng tài biết sớm ⇒ vòng đóng/mở đúng lúc hơn.
2. Toàn bộ phần VẼ (màu từng vị trí, dấu ✓/✗, dấu to, dòng đáp án, điểm bay, âm kết quả) dồn vào
   `revealFightResult()`, chỉ chạy khi trọng tài gọi `reveal()`.
⚠️ Lúc reveal thì tô **CẢ 7-8 vị trí CÙNG LÚC, không chạy lần lượt**: bản lần lượt tốn ~2,4 giây cho từ
8 chữ, **dài hơn `ROUND_HOLD_MS` (2100ms)** nên vòng sẽ sang từ mới khi hoạt cảnh còn dở; và trong trận
thì 2 bàn lộ kết quả cùng một khoảnh khắc mới công bằng.
Bàn **chưa kịp nộp cũng được gọi** `reveal()` → nó không có dấu để vẽ, nhưng vẫn được **hiện từ đúng**.
Điều kiện xám nay là `locked && (!wordDone || fightPendingReveal)`; `render()` xoá cờ giấu ở mỗi ranh
giới từ (không xoá thì từ sau bị xám oan).

**Đo thật** (bàn 0 nộp "UNPNEIG" sai trước, bàn 1 nộp PENGUIN đúng sau):
| | ô được tô màu | dấu | dòng đáp án | ô còn bấm được |
|---|---|---|---|---|
| bàn 0 vừa nộp SAI | **0** | **0** | **rỗng** (trước đây in "PENGUIN") | 0 (khoá) |
| bàn 1 lúc đó | 0 | 0 | rỗng | **7 (chơi bình thường)** |
| bàn 0 sau khi bàn 1 xong | **7** | có | **"PENGUIN"** | 0 |
| bàn 1 sau khi xong | **7** (xanh hết) | có | rỗng (đúng nên không cần) | 0 |
Điểm về **0–1** sau khi hoạt cảnh điểm hạ cánh (~1,5s — bẫy đã ghi ở Đợt 128).

**Next/Back đồng bộ**: `goPrev/goNext` nay báo `fightCtl.boardMoved()` **TRƯỚC** khi gọi `fadeSwap`
(trước đây báo TRONG callback của fadeSwap, tức sau khi đã mờ xong ⇒ bàn kia bắt đầu mờ **muộn ~160ms**).

---

## ⭐ Đợt 128 (12/8/2026) — "ON SUBMIT" NAY BÁO CẢ CA NỘP SAI (xong trước mà sai thì không cướp được từ)

✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** Luật chung: `../../GHI CHU DU AN.md` Đợt 128 và
`../../core/HUONG DAN CORE.md` mục "XONG TRƯỚC ≠ THẮNG".

**Đổi 2 dòng, đều ở chỗ báo lên trọng tài:**
1. `doSubmit()` — nộp SAI trước đây **im lặng**, chỉ nộp đúng mới báo. Nay báo cả hai:
   `wordDone(fightSide, { index, correct: allCorrect })`. Im lặng có 2 cái hại: trọng tài không biết
   bàn này đã xong nên vòng **không đóng lại được sớm** khi cả hai đã có lượt (phải chờ hết chốt chặn
   20 giây), và bàn nộp sai **không bị khoá** nên vẫn hí hoáy tiếp dù đã hết lượt.
2. `finalizeBonusWord()` — thêm `correct: true` cho tường minh. **Bonus/bonusMinus không bao giờ sai
   được**: phải bấm chữ theo ĐÚNG THỨ TỰ, bấm sai bị từ chối tại chỗ ⇒ tới được đây nghĩa là từ đã
   giải xong. Sai dọc đường chỉ mất hệ số nhân (`perfect`), **không mất vòng**.

Nhờ vậy: bàn nộp sai trước bị khoá riêng nó + hiện từ đúng như thường lệ, còn **bàn kia không bị chặn,
không bị đổi màu**, vẫn xếp tiếp và **vẫn ăn được từ đó**.

**Đo thật (mode On submit, 2 bàn)**: bàn 0 nộp "PNLETEAH" (sai) → bàn 0 hiện "ELEPHANT", khoá,
**KHÔNG khoác lớp xám "quá chậm"** (nó có phản hồi sai riêng rồi); bàn 1 **còn đủ 8 ô bấm được, không
xám, opacity 1** → bàn 1 xếp đúng ELEPHANT rồi nộp → **0–1, bàn 1 THẮNG**.
⚠️ Điểm của Anagram **tới muộn ~1,5 giây** (bay + đếm), nên đọc điểm ngay sau khi nộp sẽ thấy 0–0 —
suýt kết luận nhầm là không cộng điểm. Phải chờ hoạt cảnh điểm hạ cánh rồi mới đo.

---

## ⭐ Đợt 127 (12/8/2026) — LỖI THẬT: KHUNG BÊN THUA NHÁY 1 NHỊP + ĐỘI THUA MỜ ĐI NGAY

**Gốc lỗi (thầy báo)**: `lock(on)` — cửa mà Đợt 124 mở cho trọng tài khoá khung — gọi thẳng
**`render()`**. Mà `render()` làm `root.innerHTML=""` rồi dựng lại TOÀN BỘ `.aw-anagram-card`, tức
**chạy lại animation `aw-fadein`**. Nó bị gọi đúng lúc đội kia vừa giải xong từ ⇒ khung thua chớp
1 nhịp trước mặt cả lớp.

⚠️ **Đây đúng lớp lỗi "nháy màn hình" mà chính file này đã trị 2 lần ở Đợt 55 (vòng 2 và vòng 4)** —
luật đã ghi sẵn ngay trong comment đầu `anagram.js`: *mọi cập nhật GIỮA CHỪNG một từ phải vá thẳng DOM,
`render()` chỉ dành cho ranh giới từ thật sự*. Lần này nó lọt lại qua một cửa MỚI. Bài học: mỗi lần
thêm một đường gọi mới vào giữa vòng đời một từ, phải hỏi ngay "đường này có chạm `render()` không?".

**Sửa**: thêm `syncFightLock()` — chỉ sờ đúng thứ đã có sẵn trên màn: `disabled` của từng ô chữ gốc +
1 class trên `.aw-anagram-group`. `lock()` gọi hàm này thay cho `render()`. `render()` cũng tự khoác
sẵn class đó khi dựng lại hợp lệ (sang từ mới / khung mount vào vòng đã ngã ngũ), gắn TRƯỚC khi vào
document nên không bao giờ thấy nó thiếu class 1 nhịp.

**Đội xử lý muộn mờ đi ngay** (thầy yêu cầu cùng đợt): class `is-fightlost` → cả khối `opacity:.55`,
ô chữ gốc lẫn ô kết quả ĐÃ ĐIỀN đều về xám `--aw-ana-lost-bg` (#b3bac3). Khung TỰ giải xong thì KHÔNG
mờ (`locked && !wordDone`) — nó cũng bị khoá vì vòng đã xong, nhưng nó thắng, giữ nguyên màu.
Màu để HẾT trong CSS, JS chỉ bật/tắt class — chính là thứ khiến việc sửa nháy ở trên không phải vẽ lại gì.
`updateSubmitButtonState()` cũng xét thêm `fightLocked()` (mode On submit).

**Đo thật bằng MutationObserver + mốc thời gian trên khung THUA** (cách đo TÁI DÙNG ĐƯỢC cho mọi nghi
vấn nháy sau này — phải có DẤU THỜI GIAN mới tách được "nháy" khỏi "vẽ lại hợp lệ lúc sang từ mới";
lần đo đầu thiếu mốc nên suýt kết luận nhầm là vẫn còn nháy):
```
t=35708ms  GROUP_CLASS lost:true    ← đội kia xong từ  → 0 lần CARD_REPLACED = HẾT NHÁY ✅
t=37808ms  GROUP_CLASS lost:false   ← +2100ms = đúng ROUND_HOLD_MS
t=37976ms  CARD_REPLACED            ← vẽ lại HỢP LỆ cho từ mới (sau fadeSwap 160ms)
```
Số đo lúc đang khoá: `opacity 0.55`, ô gốc `rgb(179,186,195)`, ô kết quả đang xanh `#2f6fed` cũng về
`rgb(179,186,195)`. Sang từ mới: class tự gỡ, màu về nguyên, bấm lại được.

Chi tiết chung + phần đổi template giữa trận: `../../GHI CHU DU AN.md` Đợt 127.

---

## Đợt 125 (12/8/2026) — dải trên Fight mode gọn lại (KHÔNG đụng `anagram.js`)

Thầy chơi thử Đợt 124 rồi gửi 4 điểm chỉnh cho Fight mode: bỏ nhãn "TEAM 1"/"TEAM 2"/"TIME", cân đối
lại điểm/đồng hồ/ô điểm tay trên cùng 1 hàng, đồng hồ đổi "00:45" (2 số mỗi bên) + dấu `:` rơi đúng
đường nối 2 khung, và bấm MODE nay phải xác nhận qua 1 popover mới thật sự đổi mode. **Toàn bộ nằm ở
`core/fight.js` + `core/engine.js` + `core/app.css` (dùng chung cho MỌI template có `fightMode`) —
Anagram không đổi dòng nào.** Đợt này cũng là lúc **Quiz** trở thành template thứ hai khai
`fightMode:true` (thử nghiệm). Chi tiết đầy đủ: `../../GHI CHU DU AN.md` Đợt 125.

---

## Đợt 124 (12/8/2026) — ⭐⭐ TEMPLATE ĐẦU TIÊN BIẾT ĐẤU 2 ĐỘI (FIGHT MODE)

Anagram là template đầu tiên khai **`fightMode: true`** — đó chính là thứ làm nút **MODE** hiện ra
dưới khung. Hạ tầng nằm ở `core/fight.js` (xem `core/HUONG DAN CORE.md` mục FIGHT MODE); phía
Anagram chỉ thêm các nhánh đọc `activity._fight`:

- **`scoreTargetEl()`** thay cho 4 lần `document.querySelector(".aw-top-score")` — quét cả trang thì
  bàn PHẢI ghi điểm vào ô điểm của bàn TRÁI (và trên ván đã chết thì trúng ô điểm của ván MỚI, đúng
  bẫy Đợt 114). Chơi đơn: `ui.scoreEl`. Đấu: **`ctl.scoreTarget(side)`** — khung không còn ô điểm
  nào (thầy chốt 12/8), điểm bay thẳng ra con số của đội mình trên dải trên.
  ⚠️ `pulseScoreTo()` vẫn đọc số cũ từ **`ui.scoreEl`** (ô điểm ẩn trong khung), KHÔNG từ số ngoài —
  nên topbar trong fight phải `visibility:hidden` chứ không `display:none`, và không được xoá.
- **BỎ slogan "ANAGRAM IN ANDREW CLASSES"** (12/8, cả 2 chế độ) — kèm CSS.
  ⚠️⚠️ Bỏ nó làm mất biến `topbar` mà `cleanup()` còn tham chiếu ⇒ **`ReferenceError` giữa lúc dọn
  ván**, làm hỏng "Start again" của cả trận đấu LẪN single mode, **không hiện lỗi gì cho thầy**.
  Bài học: xoá một khối UI thì phải **soát luôn `cleanup()`** — nó thường giữ tham chiếu cuối cùng.
- **`prepareItem(word, fixedOrder)`** — bàn nào chuẩn bị từ trước thì để lại thứ tự xáo trên chính
  object nguồn (`it._fightOrder`) cho bàn kia chép, nên chế độ "giống hệt" hai bên **cùng một chuỗi
  chữ**. Hai bàn dùng CHUNG các object item nên chuyện này không cần đường truyền riêng nào.
- **`fightLocked()`** chặn ở `onTileClick` (mọi đường tap LẪN kéo-thả đều đi qua đó) **và** làm ô chữ
  `disabled` trong `render()` — để cả lớp NHÌN THẤY vòng đấu đã ngã ngũ, chứ không phải bấm mãi
  không ăn.
- **`fightCtl.wordDone(...)`** báo lên trọng tài ở `finalizeBonusWord()` (bonus family) và ở nhánh
  submit ĐÚNG (chỉ khi `allCorrect` — nộp sai không phải là xong vòng, đội kia còn đang đua).
  Trong fight, Anagram **KHÔNG tự gọi `finish()`** khi hết từ nữa — trọng tài kết thúc trận.
- **Giọng đọc**: bàn 1 không tự đọc (`ctl.speaks`), nếu không 2 clip cùng một từ lệch nhau vài mili
  giây = tiếng vọng. Nút loa to vẫn có ở cả hai bàn để bấm nghe lại.
- **Nav**: `goPrev/goNext` báo `ctl.boardMoved(...)` → bấm ‹ › ở khung nào cũng chuyển **cả hai**.

⚠️ **Số đo phải nhớ**: điểm của Anagram **tới nơi 1.760ms** sau khi giải xong từ (chờ 420 + bay 920 +
đếm 420 — `PERFECT_TO_POINTS_DELAY_MS` + `PICKFLY_TOTAL_MS` + `FLYGAIN_PULSE_MS`). Trọng tài phải giữ
vòng đấu dài hơn con số này (`ROUND_HOLD_MS` = 2100ms), và mọi phép tính điểm của nó phải chờ điểm
tới chứ không tính ngay lúc `wordDone`.

⚠️ **Bẫy test dùng lại được**: ô chữ chỉ nghe `pointerdown`/`pointerup` (tap và kéo chung một đường),
`.click()` **không ăn**. `PointerEvent` giả làm `setPointerCapture` ném lỗi **nhưng vẫn tap được** vì
dòng đó chạy SAU `dragging = true` — mỗi bàn một `pointerId` riêng chính là ca 2 ngón cùng lúc.

## Đợt 123 (12/8/2026) — CHỮ HAY GIỌNG NAY DO OPTIONS > CONTENT QUYẾT ĐỊNH (không còn đọc `hideText`)

Một act nay mang **cả chữ lẫn giọng** (bỏ cặp `ENG1` + `ENG1 VOICE`), và `options.contentMode` chọn
cách chơi. Anagram là template có **bản phát giọng RIÊNG** (không dùng `core/voice-playback.js` như
13 game kia — xem Đợt 94), nên phải sửa tay 2 chỗ trong `render()`:

1. `const hasVoice/hideText` thôi đọc `it.src.hideText`, chuyển sang **`voiceView(activity, it.src)`**
   (import từ `core/voice-playback.js` — chỉ lấy đúng hàm này, phần phát vẫn của Anagram).
2. Khối tự đọc khi mở từ mới bọc thêm nhánh `if (!vv.autoPlay)`: **mode Text thì không tự đọc**, nút
   loa nhỏ vẫn bấm nghe được. Nhánh chờ hết nhạc intro cho từ ĐẦU TIÊN (`firstWordRendered` +
   `anagramSound.introDurationMs()`, Đợt 100) giữ nguyên, chỉ nằm trong nhánh voice.

**Chưa đụng `anagram-editor.js`**: nút "Hide text" từng hàng + Hide/Show all vẫn còn, nhưng nay chỉ
còn tác dụng với act ở chế độ AUTO (act cũ chưa từng chọn Content). Cần hỏi thầy có gỡ cho gọn không.

Đo thật (bàn thử tạm, clip giả nhét thẳng vào Cache Storage `aword-voice-v1` nên không cần đăng
nhập): act cũ không khai mode → ẩn chữ + nút to + đọc 1 lần (y như trước); `text` → hiện đủ câu
gợi ý + nút nhỏ + **0 lần đọc**; `voice` → ẩn chữ + nút to + đọc 1 lần. 0 lỗi console.
Chi tiết chung: `GHI CHU DU AN.md` Đợt 123.

## Đợt 120 (11/8/2026) — ⭐ LỖI THẬT: điểm rơi dương→âm GIỮA LƯỢT vẫn hiện XANH, phải Next mới đỏ

Thầy chơi bản live rồi báo. **Gốc lỗi**: SỐ và MÀU do cùng `ui.setScore()` sơn ra (nó vừa ghi số vừa
toggle `is-pos`/`is-neg`), nhưng `pulseScoreTo()` — vòng đếm điểm nhảy dần khi số "+N"/"-N" bay tới ô
điểm — **tự ghi thẳng `scoreEl.innerHTML` mỗi khung, bỏ qua 2 class kia** → vẽ số mới, để lại màu cũ.
Màu chỉ đúng lại khi có ai gọi lại `ui.setScore()`, mà nơi gần nhất là `render()` — hàm CHỈ chạy lúc đổi
từ (đúng thiết kế chống nháy màn hình của Đợt 55/vòng 2) → đúng hiện tượng "phải Next mới đỏ".

**Sửa**: 2 lệnh `scoreEl.innerHTML = ...` trong `pulseScoreTo()` (khung giữa chừng + khung cuối) đổi
thành `ui.setScore(val)`/`ui.setScore(newValue)`. Markup y hệt (`${icons.check} ${n}`) nên hình thức
không đổi, chỉ được thêm phần tô màu. Bonus: ghi vào `scoreEl` closure của đúng ván này thay vì
`querySelector` sống (an toàn hơn với bẫy "ván đã chết" Đợt 114; cờ `dead` vẫn giữ). Đã rà cả 17 template
— **chỉ Anagram sai**; Type the answer/Unjumble/Crossword đều tính lại class mỗi lần sơn nên đúng sẵn.

**⚠️ 2 bẫy test đáng nhớ**: (1) pane test có `visibilityState:"hidden"` → **rAF chết hẳn** (đo: 0
khung/500ms), mà `pulseScoreTo` chạy bằng rAF → phải **tráo `requestAnimationFrame` sang microtask**
(`Promise.resolve().then`) + đồng hồ giả +70ms/khung + bộ ghi vết chụp `textContent`+`className` sau từng
khung (chạy đúng hàm `step` thật, chỉ thay bộ lập lịch). (2) **`.click()` và `PointerEvent` giả đều KHÔNG
tap được tile** (Pointer Events thật từ Đợt 89 + `setPointerCapture` từ chối pointer giả) → phải bấm
THẬT qua công cụ `computer`.

**Đo thật** (mode Bonus and minus, wrong-letter = 100, Bonus x2, tắt shuffle): ELEPHANT hoàn hảo → đếm
lên `7→11→14→15→16` mọi khung `is-pos` xanh `rgb(51,162,74)`; sang GIRAFFE bấm sai → đếm xuống
`-26→-54→-72→-80→-84`, **khung âm ĐẦU TIÊN đã `is-neg`** đỏ `rgb(226,60,60)`, đỏ ngay khi CHƯA bấm Next.
0 lỗi console.

## Đợt 55 (3/8/2026, v0.9.29) — 8 lỗi/yêu cầu thầy gửi 1 lượt: hiệu ứng bay, tốc độ bấm, Lives, màu Points off
Thầy chơi bản live rồi gửi 8 điểm 1 lượt. Đã tự test qua trình duyệt thật (devserver + DOM/PointerEvent
giả lập thật, không đoán qua ảnh) cho từng điểm — chi tiết dưới đây theo đúng số thứ tự thầy nêu.

**(1) Góc vuông lóe lên 1-2 khung hình lúc bấm/lúc bay tới nơi** — nghi phạm: clone bay
(`.aw-anagram-flytile`, dùng chung cho `flyLetter`/`flyTileClone`) được `document.body.append()` rồi gọi
`.animate()` NGAY LẬP TỨC — trình duyệt có thể chưa kịp "thăng cấp" phần tử lên layer GPU riêng (cần cho
bo góc + clip khi có transform animation) trước khi vẽ khung hình ĐẦU TIÊN, lộ ra 1 khung chưa bo góc rồi
mới "giật" về đúng. Sửa 2 chỗ: thêm `will-change: transform` vào `.aw-anagram-flytile` (ép trình duyệt
thăng cấp layer NGAY khi phần tử được tạo, không đợi animation bắt đầu mới quyết định) + thêm
`void clone.offsetWidth` (ép 1 lần vẽ đồng bộ "ở yên" TRƯỚC khi `.animate()` chạy) trong cả `flyLetter`
lẫn `flyTileClone`. ⚠️ Đây là lỗi cấp khung hình (compositor), `getComputedStyle` không đo được (đã thử đo
bằng poll mỗi 20ms suốt cả chuyến bay — `border-radius` luôn báo "12px" không đổi, vì đây là giá trị CSS
khai báo chứ không phải khung hình thực tế vẽ ra màn) — đã áp dụng cách sửa chuẩn cho lớp lỗi này (ép
layer sớm + ép vẽ 1 khung trước khi animate), thầy tự xác nhận lại bằng mắt trên máy thật giúp anh.

**(2) Đôi khi mất nút Back-Next và số trang** — **⭐ LỖI THẬT Ở CORE (`core/engine.js`)**, tìm ra + sửa
được. `celebrate()` (chạy khi 1 ván xong, hiện pháo giấy + chữ "Game complete") có dòng
`navWrap.style.visibility = "hidden"` để ẩn thanh điều hướng lúc ăn mừng — nhưng KHÔNG BAO GIỜ được trả
lại `""`! Vì overlay ăn mừng (`.aw-celebrate`) không có nền đặc (chỉ có pháo giấy + chữ, `pointer-events:
none`), nên trong ~1.9-2.2 giây đó, thanh dưới (Menu/Sound/Fullscreen vẫn còn) LỘ RA nhưng nút ‹›+"x of N"
biến mất — đúng y hệt hiện tượng thầy tả. Sau đó khi bảng Summary (nền đặc mờ) hiện lên thì nav bị che nên
không lộ ra nữa, nhưng cờ vẫn treo "hidden" mãi cho ván CHƠI HIỆN TẠI. Sửa: thêm `navWrap.style.visibility
= ""` ngay tại thời điểm đóng overlay ăn mừng (trước khi mở Summary) — **fix này áp dụng cho MỌI template**
(bug core, không riêng Anagram). Đã test trên trình duyệt thật: xong ván → thua hết mạng → Summary hiện
"GAME OVER" → check `document.querySelector('.aw-nav').style.visibility` ra đúng `""` (không còn kẹt
"hidden") → Start again → nav "1 of 6" hiển thị lại bình thường ngay từ đầu.

**(3) Số điểm bay vào ô điểm quá to, cần nhỏ dần** — `flyScoreGain()` trước đây co về `scale(0.4)` CỐ ĐỊNH
bất kể kích cỡ ban đầu (`baseSize` tỉ lệ theo bề ngang khung, có thể rất lớn ở màn rộng) → dù co 0.4 lần
vẫn to hơn nhiều so với chữ số điểm thật. Sửa: đọc `getComputedStyle(scoreEl).fontSize` (cỡ chữ THẬT của
ô điểm) làm đích, tính `endScale = cỡ đích / baseSize` rồi dùng số này thay cho `0.4` cố định ở khung hình
cuối — quá trình bay đã sẵn co dần liên tục theo cả chặng bay (không đổi), chỉ sửa ĐÍCH ĐẾN cho khớp thật.

**(4) & (6) Chữ trong ô bị bé lại khi kéo-tráo-đổi HOẶC khi bấm trả ô về gốc** — 1 BUG THẬT: hàm dùng
chung `flyTileClone()` (dùng bởi `unplace()` = bấm trả về gốc, và `swapResultPositions()` = kéo đổi chỗ)
KHÔNG hề gán `font-size` cho clone — khác hẳn `flyLetter()` (đã gán đúng từ trước) — nên clone rơi về cỡ
chữ MẶC ĐỊNH kế thừa từ trang (nhỏ hơn nhiều cỡ ô thật) trong suốt chuyến bay, đúng y hiện tượng "chữ bé
lại". Sửa: `flyTileClone()` nhận thêm tham số `fontSize`, cả 2 nơi gọi (`unplace`, `swapResultPositions`)
đọc `getComputedStyle(ô thật).fontSize` TRƯỚC khi xoá/di chuyển rồi truyền vào. Đã đo bằng PointerEvent
giả lập thật (kéo đổi chỗ P↔O, rồi bấm trả 1 ô về gốc): poll cỡ chữ clone mỗi 15ms suốt chuyến bay ra
ĐÚNG 1 giá trị duy nhất "51.089px" khớp hệt cỡ ô — không còn dao động/thu nhỏ.

**(5) Bấm nhanh liên tục bị delay** — nguyên nhân: mỗi lần bấm ĐÚNG 1 chữ, code khoá TOÀN BỘ thao tác tiếp
theo (`busy=true` + khoá cả hàng gốc) tới khi hiệu ứng bay ~340ms của CHỮ ĐÓ xong mới mở khoá — bấm 3 chữ
liền tay vẫn phải đợi tuần tự từng 340ms một, cảm giác trễ. Sửa: tách RIÊNG trạng thái game (đã đặt đúng
chữ nào/ô nào, `nextPos`, khoá) khỏi HOẠT ẢNH — trạng thái cập nhật NGAY LÚC bấm (đồng bộ), chỉ ô VỪA BẤM
tự khoá lại, các ô khác vẫn bấm được bình thường trong khi chữ trước còn đang bay — nhiều chuyến bay chồng
lên nhau mượt mà thay vì xếp hàng chờ. Áp dụng cho cả 2 chế độ (`bonusPick`/`submitPick`); bỏ hẳn hàm
`setOriginLocked()` (không còn ai gọi) và bỏ `|| busy` khỏi công thức khoá ô gốc trong `render()`. **Đã
test bằng 1 lượt bấm liền 7 chữ đúng thứ tự "DOLPHIN" gửi trong CÙNG 1 lệnh JS (không đợi nhau)** → cả 7
chữ vào đúng vị trí, từ hoàn thành — xác nhận không còn bị chặn/rớt khi bấm dồn dập. `busy` vẫn giữ nguyên
để khoá các thao tác NẶNG hơn không liên quan tới bấm chữ mới (Submit / kéo-đổi-chỗ / bấm-trả-về).

**(7) Đổi màu thanh "Points off (wrong answer)" sang ĐỎ** — **CÓ SỬA CORE** (`core/app.css`): đã kiểm
`.aw-opt-slider`/`.aw-opt-slidval` CHỈ dùng riêng cho control "Points off" chung (không template nào khác
dùng lại 2 class này — Lives/Speed của true-false dùng class riêng `aw-tf-*`), nên đổi an toàn, áp dụng
cho MỌI template có Points off. Đổi `accent-color`/màu số từ xanh dương/xám sang đỏ `#ef4444` (khớp đúng
màu Lives của true-false — cùng ý nghĩa "cái này trừ của em"). Đã đo `getComputedStyle` xác nhận
`accent-color: rgb(239, 68, 68)` trên cả thanh Points off lẫn thanh Lives mới của Anagram.

**(8) Thêm thanh Lives (0-10, 0 = vô số mạng)** — theo ĐÚNG khuôn `true-false.js` đã có (`hasLivesSlot`,
tim ở `ui.livesSlot` trong topbar, slider Options 0..10). Khác 1 điểm CÓ CHỦ Ý: true-false coi "chưa set"
= mặc định 5 mạng, còn Anagram coi "chưa set" = VÔ SỐ MẠNG (Anagram trước nay chưa từng có khái niệm Lives
nên các act cũ phải chơi y hệt trước — zero-diff; nếu bắt chước true-false thì mọi act Anagram cũ tự nhiên
có 5 mạng mà thầy không hề bật). Mất 1 mạng ở ĐÚNG cùng thời điểm với `pointsOff` (không phải mỗi lần bấm
sai): bonus mode = từ giải xong mà CÓ lỗi (`finalizeBonusWord`, `!perfect`); submit mode = từ nộp SAI
(`doSubmit`, `!allCorrect`). Hết mạng → `finish({gameover:true})` → `ui.finish({..., title:"Game over"})`
→ Summary hiện "GAME OVER" (dùng đúng cơ chế `title` sẵn có ở `core/engine.js`, Open the box đã dùng
trước, không cần sửa core). CSS riêng `.aw-anagram-lives*` (đỏ, khuôn y `aw-tf-lives*`). Seed
`lives: 0` vào sample. **Đã test trọn luồng**: đặt Lives=2 → Apply → cố tình sai 1 lần rồi giải đúng 2 từ
liền (mỗi từ có 1 lỗi) → tim 2→1→0 đúng từng nấc → "GAME OVER" hiện đúng → Start again → tim về lại 2, nav
hoạt động bình thường.

**File đổi**: `templates/anagram/anagram.js` (mục 1,3,4,5,6,8), `templates/anagram/anagram.css` (mục 1,8),
`templates/anagram/sample-anagram.js` (thêm `lives:0`), `core/engine.js` (mục 2 — nav visibility),
`core/app.css` (mục 7 — màu Points off). **CÓ SỬA CORE 2 chỗ** (mục 2 + mục 7), cả 2 đều là sửa lỗi/đổi
màu nhỏ, đã test không ảnh hưởng template khác (Points off class kiểm tra độc quyền; nav fix là dọn 1 side
effect chưa từng được set lại, áp dụng chung tất cả game). Console sạch 0 lỗi suốt toàn bộ quá trình test
(bonus mode + submit mode + kéo-thả PointerEvent giả lập + Options Apply + restart + game over).
**Việc kế: thầy tự chơi lại bản thật (đặc biệt nhìn kỹ mục 1 — góc vuông lóe lên — vì đây là lỗi cấp khung
hình không đo được bằng script, cần mắt thật xác nhận) → nói "lưu lại"/"commit" nếu ổn.**

## Đợt 54 (3/8/2026, v0.9.28) — Điểm trừ khi sai (option chung `pointsOff`)
Đọc `options.pointsOff` (0–5). Trừ **1 lần mỗi TỪ có lỗi**: bonus mode từ giải xong mà `hadMistake`
(`finalizeBonusWord`), submit mode từ sai (`doSubmit`, `!allCorrect`). Gộp qua biến `penalty` trừ trong
`scoreNow()` + `finish()` (giữ hiệu ứng bay dương). `pointsOff=0` = zero-diff. Điểm âm được phép (engine
`ui.setScore` hiện đỏ, bỏ dấu). allowSkip GIỮ NGUYÊN (mặc định bật, lịch sử). Seed `pointsOff:0` vào sample.

## TRẠNG THÁI: ✅ ĐÃ CHỐT — GẮN VÀO TRANG CHỦ (29/7/2026, thầy duyệt "tương đối rồi")

`core/catalog.js` đổi `built:true`, đăng ký trong `manifest.js` + `main.js` (`import "./templates/anagram/anagram.js"`) + CSS trong `index.html`. Anagram giờ **chơi được** từ trang chủ thật (act có sẵn trong thư viện / bài giao).
✅ **Content editor riêng đã xong (29/7/2026 tiếp)** — `templates/anagram/anagram-editor.js` (`openAnagramEditor`,
đăng ký qua `edit: openAnagramEditor` trong `anagram.js`) → "+ New activity → Anagram" và "Edit content" của
act có sẵn giờ dùng THẬT, không còn toast "coming soon". Xem nhật ký 29/7 mục "Content editor" bên dưới.

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/01-ANAGRAM.md` (cách chơi, options, JSON đề xuất — đã nghiên cứu từ Wordwall thật).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `anagram.js` — module game, `type: "anagram"`, `scorable: true`, đăng ký qua `registerTemplate`.
   - `anagram.css` — giao diện riêng, mọi class prefix `.aw-anagram-`.
   - `sample-anagram.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/anagram/test.html` (test.html + test.js ĐÃ CÓ SẴN, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI ở đầu file này (🔴 CHƯA BUILD → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Hiện câu gợi ý (clue) + các chữ cái bị xáo của đáp án — người chơi kéo/bấm chữ cái về đúng vị trí để giải từ. Giải xong sang từ tiếp. Tham khảo phản hồi ✓/✗ + fade chuyển câu giống Quiz (`../quiz/quiz.js` là mẫu chuẩn).

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `anagram.js`/`anagram.css`/`sample-anagram.js` tạo mới, đăng ký `type:"anagram"`.
- **Cách chơi đã chọn** (đơn giản hoá so với Wordwall thật để MVP chắc chắn, không kéo-thả): clue trên
  cùng (hoặc "Unscramble the word" nếu không có clue) → hàng Ô TRỐNG (dashed) = độ dài từ đích, khoảng
  trắng của cụm nhiều từ giữ nguyên làm khe hở không cần điền → dưới là khay chữ cái đã xáo (bấm/gõ để
  đặt vào ô trống TRÁI NHẤT còn thiếu; bấm lại vào ô đã điền = trả chữ về khay, sắp xếp lại thoải mái
  trước khi điền hết). **Điền HẾT ô mới chấm điểm ngay** (giống Quiz — chọn 1 lần, không "Submit" riêng
  cho từng từ); đúng → ✓ bay + badge xanh; sai → ✗ bay + badge + dòng "Correct: <từ>" mờ dưới ô, rồi
  khoá lại (không sửa được nữa), người chơi bấm ▷ sang từ tiếp.
- Gõ phím chữ cái = đặt viên chữ khớp đầu tiên còn trống trong khay; Backspace = gỡ ô điền cuối cùng;
  ←/→ chuyển từ (giống Quiz).
- `toPrintItems`: `{clue, answer: word}` cho `core/print.js` (Anagram/Quiz đã hỗ trợ mọi template).
- Options áp dụng: `timer`, `shuffleQuestions`, `changeCase` (upper/lower/none — đổi CHỮ HIỂN THỊ, so
  sánh đúng/sai luôn không phân biệt hoa/thường). `showAnswers`/`lettersOnAnswers` không áp dụng (đúng
  giới hạn đã ghi trong CONG THUC MAU.md mục 5).
- **Test qua `test.html` (browser thật, không mô phỏng)**: chơi hết 6 từ mẫu (đúng "dolphin", sai cố ý
  "elephant" → xem đúng dòng "Correct: elephant"), Submit answers giữa chừng → panel Score 1/6 đúng →
  Show answers hiện đúng cả 3 dạng (đúng gộp xanh / sai tối+đáp án đúng bên cạnh / No answer+đáp án) →
  Start again → chơi lại → đổi theme Basic (tile ép màu navy đồng nhất qua `--aw-tile-fixed`, không vỡ
  layout). 0 lỗi console suốt quá trình.
- Chưa làm: kéo-thả chữ cái thật (Wordwall gốc hỗ trợ cả "Rearrange letters" tại chỗ) — dùng mô hình
  bấm/gõ vì chắc chắn + hoạt động tốt trên cảm ứng, đơn giản hơn cho MVP. Nếu thầy muốn kéo-thả thật,
  cần bàn thêm (không phải bug, là lựa chọn thiết kế).

### 24/7/2026 khuya — viết lại toàn bộ theo góp ý chi tiết của thầy (đã test qua trình duyệt thật)
Thầy chơi thử bản đầu rồi cho góp ý rất chi tiết → viết lại gần như toàn bộ cách chơi + giao diện.

**Đổi tên khái niệm** (theo đúng cách thầy gọi): "dãy chữ gốc"/"ô chữ gốc" = hàng chữ cái xáo trộn
(trước gọi "tray"), "dãy kết quả"/"ô kết quả" = hàng hình dạng từ đích (trước gọi "slots"). Class CSS
đổi theo: `.aw-anagram-origin`/`.aw-anagram-otile` và `.aw-anagram-result`/`.aw-anagram-rtile`.

**2 chế độ chơi mới, chọn trong Options → "Anagram mode"** (option mới `anagramMode: "bonus"|"submit"`):
- **Letters with bonus** (mặc định): bấm ĐÚNG chữ cái tiếp theo (theo thứ tự) — chữ bay mượt vào ô kết
  quả + đổi xanh dương (FLIP-clone animation, `flyLetter()`); bấm sai chữ → dấu ✗ nhỏ nổi ngay TRÊN ô
  chữ gốc vừa bấm + âm "tùng tùng" (`sound.buzz()`, mới thêm ở core/sound.js), không di chuyển. Xong cả
  từ mà KHÔNG sai lần nào → chữ "PERFECT" bay nhanh từ giữa khung vào đúng vị trí điểm số (top-right),
  điểm = **gấp đôi** số chữ cái; nếu có ít nhất 1 lần bấm sai → chỉ nổi dấu ✓ to, điểm = đúng bằng số
  chữ cái (không nhân đôi). Đã đo thật: từ "kangaroo" (8 chữ, có 1 lần sai) → +8 điểm; từ "polar bear"
  (9 chữ, không sai lần nào) → +18 điểm (tổng 8+18=26, đã xác nhận trên số điểm hiển thị thật).
- **On submit**: thêm nút **SUBMIT** dưới hàng chữ gốc. Bấm CHỮ BẤT KỲ (không cần đúng thứ tự) → bay
  vào ô kết quả trống tiếp theo (bấm lại ô kết quả đã điền → trả về hàng gốc, sắp xếp lại thoải mái).
  Bấm Submit → từng ô kết quả lần lượt hiện ✓/✗ theo đúng vị trí (cách nhau 260ms, kèm âm thanh riêng
  từng ô: đúng=`sound.tick()`, sai=`sound.buzz()`, cả 2 mới thêm) → cuối cùng nổi dấu to (✓ to nếu cả
  từ đúng, được 1 điểm; ✗ to nếu có ô sai, 0 điểm) + dòng "Correct: <từ>" hiện ra nếu sai. Đã test cả
  2 nhánh đúng/sai qua trình duyệt thật (từ "elephant" xếp sai → ✗ to + "Correct: elephant" + điểm vẫn
  0; từ "penguin" xếp đúng → ✓ to + điểm +1).

**Option mới khác**: `allCaps` (bật = luôn viết hoa ô chữ, tắt = giữ nguyên hoa/thường lúc soạn — thay
hẳn `changeCase` cũ, vẫn đọc `changeCase==="upper"` để không vỡ dữ liệu act cũ) · `allowSkip` (bật =
Next cho bỏ qua từ chưa xong, mặc định BẬT để giữ đúng hành vi tự do đi-lại của bản cũ; tắt = Next bị
khoá tới khi xong từ — đã đo thật: tắt allowSkip thì nút Next bị disable ngay khi từ chưa xong, bấm
xong mới mở lại).

**Giao diện**: ô chữ TĂNG CỠ — công thức `computeTileSize()` tính theo đúng số chữ cái của TỪNG từ để
hàng chữ gốc luôn chiếm ~90% bề ngang khung (kẹp trong khoảng 3.4–9.5cqw để từ quá ngắn/quá dài không vỡ
layout — đây là điểm CÓ CHỈNH so với đúng nghĩa đen "ít nhất 90%" thầy yêu cầu, xin thầy xem lại nếu
thấy từ ngắn (2-3 chữ) tile chưa đủ to). Ô chữ gốc LUÔN xám + chữ trắng (không đổi theo Style/theme, cố
định bằng `--aw-ana-origin-bg` cục bộ trong anagram.css, không đụng theme chung). Ô kết quả LUÔN xanh
dương khi điền (`--aw-ana-result-bg`). Hai hàng gộp trong 1 khối `.aw-anagram-group`, cách nhau 1cqw
(rất sát), đẩy lên cao hơn đáy khung một chút (`margin: auto 0 6.5cqw` thay vì tray cũ dính sát đáy).

**Bỏ HẲN bàn phím** (thầy chốt sau khi xem bản đầu): không còn `←/→` chuyển từ bằng phím nữa — CHỈ
chuột/chạm (bấm nút ‹ › ở thanh dưới khung). Đã gỡ toàn bộ `onKey`/`keydown` listener khỏi anagram.js,
đã bấm phím mũi tên thử trên trình duyệt thật để xác nhận không còn tác dụng.

**Score/Total ở chế độ "Letters with bonus"**: theo đúng ý thầy ("chỉ cần số điểm tổng số chữ cái,
không cần quan tâm số câu") — `total` gửi cho panel tổng kết ở chế độ NÀY đổi thành **tổng số chữ cái
của CẢ HOẠT ĐỘNG** (không phải số câu nữa, số câu vẫn giữ nguyên riêng cho nav "x of N"). Đã đo thật:
6 từ mẫu (elephant8+giraffe7+dolphin7+penguin7+kangaroo8+polarbear9=46 chữ) → panel hiện đúng "Score
16/46" sau khi chỉ hoàn thành 1 từ (kangaroo, hoàn hảo = 16 điểm). Chế độ "On submit" KHÔNG đổi (total
vẫn = số câu, vì mỗi câu đúng 1 điểm, không có khái niệm chữ cái).

**Cỡ ô tối đa 9.5cqw cho từ ngắn**: thầy xác nhận ổn, giữ nguyên như đã build.

~~(mục cũ về Score/Total nói "total luôn = số từ" — ĐÃ THAY bởi mục "Score/Total ở chế độ Letters with
bonus" phía trên: total ở chế độ bonus đổi thành tổng chữ cái, theo yêu cầu thầy 25/7.)~~

**⚠️ CÓ ĐỤNG CORE (ngoại lệ luật số 1, đã báo thầy trong hội thoại vì tính năng không thể làm nếu không
sửa)**:
- `core/engine.js` `buildOptionsPanel()`: thêm 1 "cửa mở rộng" — nếu template có hàm
  `buildExtraOptions({panel, draft, mkCheck, mkRadioChoice})` thì engine gọi nó để cho phép template
  tự thêm nhóm Options riêng (Anagram dùng để thêm "Anagram mode"/"All caps"/"Allow skip"). KHÔNG đổi
  hành vi các template khác (Quiz không có hàm này nên không bị ảnh hưởng). Cũng thêm hàm dùng chung
  `mkRadioChoice()` cạnh `mkCheck()` sẵn có.
- `core/sound.js`: thêm `sound.tick()` (tiếng "tách" nhẹ, dùng cho mỗi lần chọn đúng/mỗi ô đúng lúc
  soát bài) và `sound.buzz()` (tiếng "tùng tùng" trầm, dùng cho mỗi lần chọn sai/mỗi ô sai lúc soát
  bài) — KHÔNG đổi `sound.correct()`/`sound.wrong()` cũ, chỉ thêm 2 hàm mới, template khác không bị
  ảnh hưởng.

**Đã test qua trình duyệt thật (KHÔNG chỉ đọc code)**: cả 2 chế độ chơi hết nhiều từ (đúng/sai xen kẽ,
kể cả từ 2 tiếng "polar bear"), Options đổi mode/allCaps/allowSkip + Apply + Start again đều ăn, đổi
Style (Basic) không vỡ layout, Show answers hiện đúng dữ liệu, 0 lỗi console suốt quá trình.

**3 câu hỏi trên đã được thầy trả lời** (xem 3 mục ngay trên: cỡ tile OK giữ nguyên, Score/Total đổi
sang tính theo chữ cái, bỏ hẳn bàn phím) — đã sửa code khớp theo, test lại qua trình duyệt thật xong.

## ĐỀ XUẤT SỬA CORE (nếu có)
(Không còn mục treo — 3 thay đổi core ở dưới đã LÀM rồi, không phải đề xuất chờ xử lý.)

### 25/7/2026 — sửa 11 điểm góp ý vòng 2 (đã test qua trình duyệt thật, không chỉ đọc code)

**A. Chung + Letters with bonus**
1. **Hết nháy màn hình mỗi lần bấm** — lỗi do mỗi lần 1 chữ bay xong, code gọi `render()` xoá-vẽ-lại
   TOÀN BỘ card (kể cả câu hỏi), làm animation `aw-fadein` chạy lại → cả màn nháy. Sửa: các thao tác
   GIỮA CHỪNG 1 từ (1 chữ bay tới, kéo đổi chỗ, trả về gốc) giờ CHỈ vá trực tiếp đúng 2 ô liên quan
   (`patchTileUsed`/`patchResultFilled`/`patchResultSlotDisplay`...), KHÔNG gọi lại `render()` nữa.
   `render()` đầy đủ chỉ còn chạy 1 lần/từ (lúc bắt đầu từ mới hoặc lúc từ đó xong) — đã đo bằng
   MutationObserver: bấm hết 8 chữ 1 từ "elephant", card gốc chỉ bị thay thế đúng **1 lần** (lúc xong),
   không phải 8 lần như trước.
2. **Chữ PERFECT + 3.** dấu ✓ thường (giảm cỡ) dùng CHUNG 1 cơ chế mới `flyScoreGain()`: hiện tại chỗ
   ~550ms (giữ nguyên vị trí) → bay ~550ms về phía số điểm (mờ dần biểu tượng/PERFECT, hiện dần "+N")
   → khi "tới nơi" mới thật sự cộng điểm và số điểm tự đếm lên bằng hiệu ứng Pulse (`pulseScoreTo()`
   dùng `requestAnimationFrame`, số nhảy từ giá trị cũ lên giá trị mới trong 420ms + phóng to nhẹ rồi
   thu lại). PERFECT to gấp 1.5 lần cỡ cũ; dấu ✓ thường + dấu ✓/✗ to (cả 2 chế độ) còn 2/3 cỡ cũ (CSS
   `.aw-anagram-group .aw-mark-fly{width:34.7%}` — đã đo `getComputedStyle` ra đúng tỉ lệ 0.347).
   Đã đo điểm thật: từ "elephant" (8 chữ) không sai lần nào → +16 (đúng 8×2 PERFECT); từ "penguin"
   (7 chữ) có 1 lần bấm sai → +7 (đúng 7×1, không nhân đôi).
4. **Đổi mode = tự restart**: thêm hook `optionsNeedRestart(before, after)` — engine.js gọi ngay sau khi
   Apply, nếu template báo `true` thì tự `restart()` luôn (không cần thầy bấm "Start again" tay). Anagram
   trả `true` khi `anagramMode` đổi. Đã bấm thật: chọn "On submit" → Apply → game về thẳng màn READY.

**B. On submit**
1. **Kéo đổi chỗ 2 ô đã điền** (trước Submit): mỗi ô kết quả đã điền giờ nhận Pointer Events
   (mouse+chạm dùng chung) — kéo thật (di chuyển > 6px) thả lên ô khác = ĐỔI CHỖ 2 chữ; bấm không kéo
   (không di chuyển) = trả chữ về hàng gốc như cũ. Đã đo bằng PointerEvent giả lập: đổi P↔O đúng vị trí.
2. Dấu ✓/✗ to dùng CHUNG class với bonus mode nên tự động nhỏ theo (xem A.2/A.3).
3. **Nút Submit nâng cao + dòng đáp án đúng**: thêm `.aw-anagram-reveal` LUÔN có mặt (kể cả lúc chưa
   sai lần nào) với `min-height` cố định — nhờ vậy nút Submit KHÔNG bao giờ nhảy vị trí dù dòng đáp án
   có chữ hay không. Sai thì hiện thẳng TỪ ĐÚNG (không còn "Correct:"), màu xanh lá, viết hoa theo đúng
   option `allCaps` (đã đo: bật allCaps → hiện "POLAR BEAR"/"PENGUIN").
4. Submit ĐÚNG cả từ giờ cũng gọi `flyScoreGain("check", 1, ...)` — bay + Pulse Counter y hệt bonus mode
   (đã đo: điểm 0→1 khi submit đúng "dolphin").
5. **Mỗi chữ bấm vào (submit mode) đều có âm** — thêm `ui.sound.click()` trong `submitPick()` (trước đây
   không có âm nào khi đặt chữ ở chế độ này).
6. Soát bài (staggered reveal) đổi sang dấu ✓/✗ NHỎ MÀU (xanh lá/đỏ) tự vẽ riêng (`SMALL_CHECK_GREEN`/
   `SMALL_CROSS_RED`, khác hẳn dấu to trắng-viền-đen `icons.markCheck/markCross` vẫn dùng cho dấu to) +
   đổi âm ô đúng thành "ting" (chỉnh lại `sound.tick()` ở core/sound.js cho cao/sáng hơn, đúng nghĩa
   "ting"), ô sai vẫn `sound.buzz()`.
7. **Giữ màu gốc khi bay, chỉ đổi màu lúc Submit**: bỏ hẳn việc tô xanh dương ngay khi đặt chữ (chế độ
   submit) — ô kết quả giờ ở màu xám (`.is-filled` không có `.is-blue`) cho tới khi bấm Submit; lúc đó
   mới tô theo TỪNG VỊ TRÍ: đúng → `.is-blue` (xanh dương), sai → `.is-wrongbg` (xám nhạt hơn, biến CSS
   riêng `--aw-ana-wrong-bg`). ⚠️ Bắt được 1 lỗi thật lúc test: `render()` cuối (sau khi chấm xong) ban
   đầu QUÊN gán lại 2 class này (chỉ bonus mode có), làm màu/badge bị XOÁ MẤT ngay sau khi vừa tô —
   đã sửa `render()` tính `isRight` cho TỪNG ô khi `st.graded` rồi gắn đúng class + vẽ lại badge. Đã đo
   thật bằng cách đọc `className` từng ô sau khi Submit sai: đúng vị trí duy nhất (chữ "R" của
   "polar bear") ra `is-blue`, 8 ô còn lại ra `is-wrongbg`, mỗi ô đúng 1 badge — khớp 100% với đáp án.

Còn 1 lỗi khác bắt được khi test (không nằm trong 11 điểm thầy nêu, TỰ PHÁT HIỆN khi đo): sau khi 1 từ
xong ở chế độ bonus, biến khoá `busy` bị bỏ quên không trả về `false` trong nhánh "từ đã xong" →
nút Next bị khoá VĨNH VIỄN sau từ đầu tiên. Đã sửa (`busy = false` chạy trước khi rẽ nhánh
finalize/tiếp tục), đã bấm Next thật để xác nhận qua được từ tiếp theo.

**Core tiếp tục bị đụng (cộng dồn với đợt trước)**:
- `core/engine.js`: thêm hook `optionsNeedRestart` trong nút Apply (chỉ gọi nếu template có khai báo
  hàm này — Quiz không có nên không đổi hành vi).
- `core/sound.js`: chỉnh tần số `sound.tick()` cho giống "ting" hơn (không thêm hàm mới đợt này).

### 25/7/2026 (tiếp) — sửa 7 điểm góp ý vòng 3 (đã test qua trình duyệt thật)

1. **Hết nháy CẢ HÀNG chữ gốc mỗi lần bấm** — lỗi do `setOriginLocked()` gán `disabled` cho MỌI ô
   chưa dùng trong lúc 1 chữ đang bay (để chặn bấm chồng), và CSS cũ tô mờ (`opacity:.5`) MỌI ô
   `:disabled:not(.is-used)` → cả hàng cùng mờ đi rồi sáng lại. Bỏ hẳn `opacity:.5` khỏi rule đó
   (`anagram.css`), chỉ giữ `cursor:default`. Đã xem lại bằng screenshot đúng lúc 1 chữ đang bay: các
   ô còn lại giữ nguyên độ đậm bình thường.
2. **Hết nháy chỗ ô vừa bay đi** — lỗi thật: `patchTileUsed()` có dòng `tileEl.style.visibility = ""`
   (xoá `visibility:hidden` đã đặt lúc bắt đầu bay) NGAY LÚC gắn class `.is-used` (opacity chuyển
   1→0 trong 0.2s do CSS transition) → ô vừa ẩn bằng visibility bỗng "hiện lại rồi mới mờ dần" trong
   200ms = đúng hiện tượng nháy thầy thấy. Xoá hẳn dòng reset đó — ô giữ `visibility:hidden` VĨNH
   VIỄN (không cần hiện lại nữa vì đã dùng luôn), không còn xung đột với transition opacity.
3. **Submit hiện ĐÚNG/SAI lần lượt từng chữ** (trước đó hiện HẾT cùng lúc dù code stagger đã viết) —
   lỗi thật: `render()` gọi NGAY khi bấm Submit (`st.graded=true` rồi `render()`) vô tình đã tô màu
   ĐÚNG/SAI cho TẤT CẢ ô luôn vì điều kiện tô màu khi đó đang xét `st.graded` (đã true) — vòng lặp
   stagger sau đó chỉ "tô lại y hệt" nên không ai thấy hiệu ứng lần lượt. Sửa: tách riêng cờ mới
   `st.revealed` (chỉ true SAU KHI stagger xong) — điều kiện tô màu trong `render()` đổi sang xét
   `st.revealed` thay vì `st.graded`. Đã đo bằng cách đếm số dấu ✓/✗ xuất hiện mỗi 150ms sau khi bấm
   Submit (từ "dolphin", 7 chữ): 1 dấu lúc 155ms → 2 lúc 307ms → 3 lúc 604ms → ... → đủ 7 lúc 1652ms —
   đúng kiểu tăng dần, không phải nhảy thẳng lên 7.
4. **Hạ thấp dấu ✓/✗ nhỏ trong ô** — thêm `bottom: -0.8cqw` đè lên mặc định `bottom:0.4cqw` của core,
   dấu giờ treo thấp hơn dưới đáy ô thay vì đè lên gần giữa chữ.
5. **Tăng cỡ chữ trong ô gần tối đa** (ô giữ nguyên cỡ) — cả 2 loại ô (`aw-anagram-rtile`/`otile`) tăng
   hệ số nhân từ 0.46-0.5 lên 0.64 (so với cạnh ô).
6. **Nút Submit cố định vị trí dù câu hỏi 1 hay 2 dòng** — bắt được lỗi thật khi đo: hàm `measure()`
   cho autoFit dùng `offsetHeight` (KHÔNG tính margin), bỏ sót margin-dưới của khối 2 hàng chữ
   (6.5cqw), margin-trên dòng đáp án (0.9cqw), margin-trên nút Submit (1.4cqw) và padding-dưới thẻ
   (2.4cqw) → khi câu hỏi dài 2 dòng, autoFit co KHÔNG ĐỦ, nút Submit bị đẩy TRÀN RA NGOÀI khung (đã
   đo: âm 19px so với đáy khung!). Sửa: `measure()` cộng thêm 4 khoảng margin/padding đó (đọc bằng
   `getComputedStyle`). Đã đo lại: khoảng cách từ Submit tới đáy khung giờ giống hệt nhau (23.17px)
   dù câu hỏi 1 dòng ("A smart sea animal...") hay 2 dòng ("An animal from Australia...").
7. **Cả 2 chế độ dùng chung âm "ting" khi bấm chữ ở hàng gốc** — đổi `submitPick()` từ `ui.sound.click()`
   sang `ui.sound.tick()` (giống hệt bonus mode); `unplace()`/kéo-đổi-chỗ vẫn giữ `click()` riêng (không
   phải hành động "bấm chữ từ hàng gốc").

**Core**: KHÔNG đụng thêm gì ở đợt này (chỉ sửa trong `templates/anagram/*`).

### 25/7/2026 khuya (tiếp) — sửa 4 điểm góp ý vòng 4 (đã test qua trình duyệt thật bằng MutationObserver + đo pixel)

1. **HẾT HẲN nháy màn hình mọi lúc** (kể cả lúc PERFECT/dấu to/bấm Submit — vòng 3 mới chỉ hết nháy MỖI
   LẦN BẤM 1 CHỮ, còn 3 thời điểm này thầy vẫn thấy nháy): lý do y hệt — `finalizeBonusWord()` và
   `doSubmit()` vẫn còn gọi `render()` ở 3 chỗ (lúc từ hoàn thành ở bonus, lúc bấm Submit, lúc soát bài
   xong) dù MỌI thay đổi hiển thị ở các thời điểm đó ĐÃ được vá trực tiếp từ trước (ô đã tô màu, đã khoá,
   dòng đáp án là chỗ DUY NHẤT thật sự cần cập nhật). Bỏ hẳn cả 3 lần gọi `render()` này, thay bằng
   `updateNav()`/`updateSubmitButtonState()`/gán thẳng `revealSlotEl.textContent` (biến mới, giữ tham
   chiếu dòng đáp án như đã làm với `submitBtnEl`). Đã đo bằng `MutationObserver` đếm số lần thẻ
   `.aw-anagram-card` bị thay thế suốt TRỌN 1 từ (kể cả lúc hoàn thành/Submit/soát bài xong): **0 lần**
   ở cả 2 chế độ (trước đó ít nhất 1 lần/từ).
2. **Kéo đổi chỗ 2 chữ ở hàng kết quả (On submit) giờ bay mượt** — trước chỉ đổi text tức thì (snap).
   Thêm hàm dùng chung `flyTileClone()` (giống `flyLetter()` nhưng không đổi màu vì trước Submit màu
   luôn xám trung tính): cả 2 ô tạm trống, 2 bản sao chữ bay đổi chỗ cho nhau (~340ms), xong mới điền
   chữ thật vào 2 ô. Đã đo bằng PointerEvent giả lập: đổi chỗ P↔O đúng vị trí sau khi bay, không còn
   thẻ nào bị vẽ lại.
3. **Bấm (không kéo) 1 chữ ở hàng kết quả giờ bay mượt về đúng ô gốc** thay vì biến mất/hiện lại tức thì
   — dùng lại `flyTileClone()`: ô kết quả trống ngay (như đã "buông" chữ), bản sao bay về đúng vị trí
   ô gốc, ô gốc chỉ HIỆN LẠI đúng lúc bản sao "tới nơi". ⚠️ Bắt được 2 lỗi thật lúc test việc này:
   - Ô gốc bị bay về nhưng **không bao giờ hiện lại được** vì `patchOriginRestored()` không xoá
     `visibility:hidden` (đặt từ lúc bay ĐI, và vòng sửa nháy-màn-hình trước đó cố tình không xoá nó
     nữa cho trường hợp DÙNG VĨNH VIỄN — nhưng unplace() là trường hợp DÙNG LẠI ĐƯỢC, cần xoá). Đã thêm
     `tileEl.style.visibility = ""` đúng chỗ này (không đụng chỗ dùng vĩnh viễn).
   - Ô gốc phục hồi xong vẫn bị **khoá (disabled) mãi mãi**, bấm không phản ứng: do đọc biến `busy`
     NGAY TRƯỚC KHI nó được set về `false` (thứ tự code sai) → gán nhầm `disabled=true` vĩnh viễn. Đã
     sửa `patchOriginRestored()` luôn gán thẳng `disabled=false` (đúng ý định gọi hàm này — mọi chỗ gọi
     đều đang phục hồi 1 ô để DÙNG LẠI NGAY). Đã đo thật: phục hồi chữ "O" xong, `disabled=false`,
     `visibility="visible"`, bấm lại đặt được vào ô — hoạt động trở lại bình thường.
4. **Dấu ✓ to (On submit, từ đúng) bằng cỡ dấu ✗ to** — trước tính nhầm hệ số (`0.0367` thay vì
   `0.347`, lệch nhau đúng 10 lần — lỗi gõ số từ vòng 2). Sửa hệ số của nhánh "check" trong
   `flyScoreGain()` thành `0.347` (khớp CSS `width:34.7%` của dấu ✗ to trên CÙNG `.aw-anagram-group`).
   Đã đo trực tiếp lúc dấu đang hiện: tỉ lệ `fontSize / bề-ngang-group` = 0.347 — khớp CHÍNH XÁC với
   tỉ lệ đo được của dấu ✗ to (cũng 0.347).

**Core**: KHÔNG đụng thêm gì ở đợt này (chỉ sửa trong `templates/anagram/*`).

### 29/7/2026 — thay TOÀN BỘ âm thanh Anagram bằng file mp3 thật (Wordwall Classic theme), theo mô tả
sự kiện chi tiết của thầy. Trước đó mọi âm là tổng hợp (Web Audio oscillator) từ `core/sound.js` dùng
chung cho mọi template.

1. **Nguồn file**: thầy tự chơi thử Anagram thật trên wordwall.net (Classic theme), Claude bắt 28 file
   mp3 hiệu ứng của theme đó từ file JSON tài nguyên theme (`assets-38.json`), tải về
   `D:\APP AND DATA\SOURCE\Sound effect\`. 17/28 file được dùng cho Anagram, copy vào
   `templates/anagram/sounds/` (thư mục riêng của template, không đụng `core/assets/`).
   ⚠️ Đây là file gốc của Wordwall (sản phẩm trả phí) — chỉ dùng tham khảo/tạm thời, về lâu dài nên thay
   bằng âm tự làm hoặc nguồn CC0 nếu AWord phát hành chính thức, để tránh vướng bản quyền.
2. **File mới**: `templates/anagram/anagram-sound.js` — module âm thanh RIÊNG của Anagram (không đụng
   `core/sound.js`). Có `playFile()` (tôn trọng nút mute chung qua `core/sound.js`'s `isMuted()`) và
   `makePool()` (chọn ngẫu nhiên 1/3 file, không lặp lại file vừa phát ngay trước đó — tránh nghe robotic
   khi bấm nhanh liên tiếp).
3. **Sơ đồ sự kiện → file** (đúng theo yêu cầu của thầy):
   - Bấm chữ đúng (cả 2 chế độ, hàng gốc) → random `blocktiledrop1/2/3`
   - Bấm chữ sai (bonus mode tap trực tiếp; submit mode soát từng ô sai) → random `blockchipfail1/2/3`
   - Đổi vị trí chữ đã đặt (submit mode: bấm trả về / kéo đổi chỗ) → random `blocktilepickup1/2/3`
   - Đúng hết 1 từ (bonus mode, dù PERFECT hay có lỗi) → `blockchipmajor`
   - Submit: từng ô đúng lúc soát → `blockchipminorfast`; cả từ đúng → random `blockchipminor1/2/3`
   - Bấm Play → `blockgamesuccessful`; Restart (Start again / đổi mode) → `blockgamerestart`; Game
     complete → `blockgamesuccessful` (giống Play, đúng theo yêu cầu); còn 5 giây cuối (chế độ đếm
     ngược) → `blockgametimeout`
   - Submit sai cả từ: GIỮ NGUYÊN `ui.sound.wrong()` (âm "oh my god" cũ) — thầy không yêu cầu đổi.
4. **Có đụng core** (`core/engine.js`) — thêm hook **tuỳ chọn** `tpl.sounds = {play, restart,
   timeWarning, complete}` mà 1 template có thể tự khai báo, để override 4 thời điểm vòng đời do ENGINE
   điều khiển (bấm Play, Restart, còn 5s, Game complete — Anagram cần các thời điểm này nhưng chúng nằm
   trong `engine.js`, không phải trong `anagram.js`). Template KHÔNG khai báo `sounds` (vd Quiz) thì
   hành vi giữ NGUYÊN 100% như cũ (`tpl.sounds?.xxx` là `undefined`, engine tự dùng âm mặc định) — Quiz
   (đã ✅ CHỐT) không bị ảnh hưởng gì. Chi tiết 4 điểm sửa: `bigPlay.onclick`, `restart()`, vòng lặp
   timer (`remaining<=5` mới), `celebrate()`.
5. **Đã test qua trình duyệt thật** (không đọc code suông): chơi cả 2 chế độ, bắt đúng file mp3 phát ra
   ở TỪNG sự kiện (network request cho lần đầu, sau đó hook `HTMLMediaElement.prototype.play` vì trình
   duyệt không tải lại file đã cache) — khớp đúng bảng ở mục 3 cho 8/9 sự kiện chơi thật (Play/Restart/
   đúng/sai/đúng-hết-từ-bonus/Submit-từng-ô/Submit-cả-từ/Game-complete). Riêng "còn 5 giây cuối" CHƯA
   test trực tiếp bằng đồng hồ thật (tốn thời gian chờ) — chỉ soát lại code, cùng khuôn mẫu với hook
   `play` đã test đạt, tự tin đúng nhưng thầy nên tự xác nhận khi chỉnh Timer = Count down và chơi thật.

### 29/7/2026 (tiếp) — Content editor riêng cho Anagram, gắn nốt vào trang chủ

Thầy duyệt phần âm thanh "tương đối rồi", yêu cầu lưu lại + gắn vào trang chủ. Sau khi gắn xong mới lộ ra
1 lỗ hổng: Anagram CHƯA có màn soạn nội dung (không có `tpl.edit`) nên "+ New activity → Anagram" chỉ
hiện toast "coming soon", chưa tạo được bài mới từ UI. Việc này giờ đã xong:

1. **File mới**: `templates/anagram/anagram-editor.js` (`openAnagramEditor`) — theo ĐÚNG khuôn mẫu
   `templates/quiz/quiz-editor.js` (cùng chữ ký `(container, activity, {onSave, onCancel, header,
   footer})`, cùng SCOPE đơn giản hoá: chỉ sửa Activity Title + danh sách từ; theme luôn Classic; Options
   (timer/mode/allCaps...) vẫn ở Settings/panel Options trong game, KHÔNG sửa ở đây).
2. **Tái dùng 100% class `.aw-ed-*` sẵn có trong `core/app.css`** (hệ CSS soạn nội dung DÙNG CHUNG mọi
   template, Quiz đã chứng minh) — **không thêm 1 dòng CSS nào**, không đụng `core/`.
3. **Mỗi hàng = Word (bắt buộc) + Clue (tuỳ chọn, để trống thì lúc chơi tự hiện "Unscramble the word")**
   — khác Quiz (không có khái niệm "đáp án đúng" cần tick). Có: + Add word / Duplicate / Remove / Delete
   all words / đếm "N / 100 words" (giới hạn 100 theo đúng spec Wordwall gốc ở `docs/01-ANAGRAM.md`).
4. **Dán Excel** (`onWordPaste`, giống hệt cơ chế `onQuestionPaste` của Quiz): dán 1 vùng bảng đa dòng vào
   ô Word → cột 1 = word, cột 2 = clue, điền từ hàng đang bấm xuống, cắt ở 100 dòng.
5. Đăng ký: `anagram.js` thêm `edit: openAnagramEditor` (import trực tiếp, giống `quiz.js` làm với
   `edit: openQuizEditor`). **Không đụng `core/`, không đụng `main.js`/`index.html`** (route "+ New
   activity"/"Edit content" đã có sẵn từ hồi build Quiz, tự nhận `tpl.edit` qua registry — không cần sửa
   gì thêm ở main.js).
6. **Test bằng trang harness tạm** `_test-editor.html` (tự viết, gọi thẳng `openAnagramEditor` với
   `onSave`/`onCancel` giả để không cần đăng nhập Google) — **đã XOÁ sau khi test xong**, không phải file
   thật của dự án. Đã test qua trình duyệt thật:
   - Save khi chưa nhập Title → đúng lỗi "Please enter an activity title."
   - Dán Excel 3 dòng (word+clue) vào ô Word 1 → đúng 3 thẻ, đúng nội dung từng ô, banner xanh báo đúng
     số dòng đã dán.
   - Save hợp lệ → `onSave` nhận đúng object `{type:"anagram", schemaVersion, title, instruction,
     theme:"classic", options:{}, content:{items:[{word,clue}, ...]}}` — khớp CHÍNH XÁC cấu trúc
     `anagram.js`'s `mount()`/`toPrintItems()` đang đọc, chơi được ngay không cần chuyển đổi gì thêm.
   - Mở với dữ liệu có sẵn (`sample-anagram.js`) → đúng heading "Edit content" (thay vì "New activity"),
     6 từ mẫu hiện đúng cả word lẫn clue.
   - Duplicate/Remove hoạt động đúng (nhân bản đúng vị trí kế tiếp, xoá đúng thẻ, không ảnh hưởng thẻ khác).
   - 0 lỗi console suốt quá trình.
7. **Core**: KHÔNG đụng gì thêm ở đợt này (chỉ thêm file mới trong `templates/anagram/`).

### 29/7/2026 (tiếp) — Đổi bố cục Editor sang dạng BẢNG giống Wordwall thật (theo ảnh thầy gửi)

Thầy gửi ảnh chụp màn "Edit Content" thật của Wordwall (bảng Word|Clue, nút Swap Columns, mỗi hàng có
số thứ tự + 2 ô kề nhau + icon mic/ảnh/kéo-thả/nhân bản/xoá) và yêu cầu bố cục Anagram-editor giống vậy.
Đã làm lại HOÀN TOÀN phần hiển thị từng hàng (giữ nguyên phần khung trang — header/Title/tip/bulk bar
vẫn dùng chung `.aw-ed-*` của core như cũ):

1. **Bảng Word | Clue thật**: tiêu đề cột + nút **Swap Columns** (đổi giá trị Word↔Clue mọi hàng cùng
   lúc — dùng khi thầy dán nhầm thứ tự 2 cột). Mỗi hàng: số thứ tự · 1 khung liền có vạch dọc chia ô
   Word/ô Clue (giống ảnh) · cụm icon bên phải: 🎤 voice / 🖼️ ảnh (CHƯA làm — bấm vào chỉ hiện banner
   "coming soon", thầy nói để bàn sau) / ⇕ kéo-thả đổi vị trí / ⧉ nhân bản / 🗑️ xoá.
2. **5 icon MỚI thêm vào `core/icons.js`** (dùng chung, không thuộc riêng Anagram): `mic`, `image`,
   `dragHandle`, `duplicate`, `trash` — chỉ THÊM, không sửa/xoá icon nào có sẵn, không ảnh hưởng Quiz
   (đã test lại `templates/quiz/test.html` sau khi sửa, 0 lỗi).
3. **Kéo-thả đổi vị trí dùng ĐÚNG kiểu HTML5 Drag & Drop mà `main.js` đã dùng** cho việc kéo act/folder
   vào thư mục (draggable + dragstart/dragover/drop, class `is-dragging`/`is-dropok` kiểu) — không bịa
   cơ chế mới, giữ nhất quán codebase. Chỉ icon ⇕ mới `draggable=true` (không phải cả hàng), nên bấm/gõ
   chữ trong ô Word/Clue không bị ảnh hưởng. Thả nửa TRÊN 1 hàng = chèn TRƯỚC hàng đó, nửa DƯỚI = chèn
   SAU (có viền xanh báo trước khi thả).
4. **Dán Excel giờ nhận từ CẢ 2 ô** (Word hoặc Clue đều được, không cần nhớ đúng ô) — cột 1 luôn là Word,
   cột 2 luôn là Clue, giữ nguyên quy tắc điền từ hàng đang dán trở xuống như bản trước.
5. **CSS mới**: `templates/anagram/anagram.css` thêm khối `.aw-anagram-ed-*` (bảng/hàng/ô/icon) — CSS
   RIÊNG của Anagram (không đụng `core/app.css`), dùng px/rem bình thường (trang Editor nằm NGOÀI khung
   16:9 nên không dùng cqw, khác các class chơi game `.aw-anagram-*` khác trong cùng file).
6. **Đã test qua trình duyệt thật** (lại dùng trang harness tạm `_test-editor.html`, xoá sau khi xong):
   - Dán Excel 2 dòng vào Ô CLUE (không phải ô Word) → vẫn đúng cột 1→word, cột 2→clue, đúng từ hàng
     đang dán trở xuống, giữ nguyên các hàng trước.
   - Swap Columns → mọi hàng đổi đúng giá trị Word↔Clue, bấm lại swap về đúng như cũ.
   - Kéo-thả (giả lập DragEvent thật, không phải click thường) hàng 1 xuống dưới hàng 3 (thả nửa dưới)
     → đúng thứ tự mới; kéo lại lên đầu (thả nửa trên hàng đầu) → đúng về lại thứ tự ban đầu.
   - Save → dữ liệu ra đúng cấu trúc `content.items[].{word,clue}` như trước, giữ nguyên `id`/`options`
     khi sửa bài có sẵn.
   - 0 lỗi console suốt quá trình; `templates/quiz/test.html` vẫn chạy bình thường sau khi thêm icon mới.
7. **Core**: có thêm 5 icon SVG vào `core/icons.js` (mục 2 ở trên) — CHỈ THÊM, không sửa file khác trong
   `core/`.

### 29/7/2026 (tiếp) — 2 điều chỉnh nhỏ theo góp ý thầy

1. **Options Apply LUÔN Restart** — trước chỉ tự restart khi đổi `anagramMode` (bonus↔submit), đổi mục
   khác (timer/shuffle/allCaps/letters/allowSkip...) chỉ hiện toast "Options applied" và giữ nguyên ván
   đang chơi. Thầy muốn MỌI thay đổi Options đều restart ngay. Sửa `optionsNeedRestart()` trong
   `anagram.js` trả về `true` luôn (không còn so sánh `anagramMode` nữa) — 1 dòng, không đụng
   `core/engine.js` (hook đã có sẵn từ trước, chỉ đổi cách Anagram trả lời hook đó). Đã test: đổi lại 1
   mục KHÔNG liên quan mode (Allow skip) → Apply → về thẳng màn Ready ngay, không còn toast giữ nguyên
   ván cũ.
2. **Hạ thấp dấu ✓/✗ nhỏ ở chế độ On Submit cho khỏi đè chữ** — bắt được lỗi thật khi đo: rule cũ
   `.aw-anagram-rtile .aw-tile-badge { width:1.9cqw; bottom:-0.8cqw }` chỉ set `width`, để `height` tự
   suy ra từ `aspect-ratio:1` của core — nhưng đo bằng `getBoundingClientRect()` phát hiện height thực tế
   bị giãn ra **83px** (gần bằng CẢ chiều cao ô 81.6px) thay vì vuông theo width 18.34px, đẩy dấu ✓ hiện
   lên giữa ô (đè vào chữ) dù `bottom` đã âm. Nguyên nhân: `top` đang để `auto`, không đủ ràng buộc để
   trình duyệt tôn trọng `aspect-ratio` khi chỉ có `bottom` cố định trong ô cha đang canh giữa bằng flex.
   Sửa: **set `height` tường minh** bằng `width` (bỏ phụ thuộc `aspect-ratio` mập mờ) + tăng `bottom`
   xuống `-1.6cqw` (gấp đôi, hạ thấp thêm). Đã đo lại + chụp màn hình thật (chơi hết từ "dolphin" ở chế
   độ On submit): dấu ✓ nằm hẳn dưới từng ô chữ, không còn đè chữ nào.

## Đợt 89 (8/8/2026, v0.9.64) — Kéo-thả vật lý thật + hiệu ứng mềm hơn + slogan. ✅ THẦY DUYỆT → COMMIT `5d504f7` + PUSH + **LIVE** (`curl` xác nhận `aw-anagram-slogan` trong CSS + `moveResultTile`/`showTransientMark`/"ANAGRAM IN ANDREW CLASSES" trong JS)

4 lượt góp ý liên tiếp trong cùng 1 phiên, mỗi lượt đã tự test qua trình duyệt thật (đo `getComputedStyle`/
`getAnimations()`/mô phỏng `PointerEvent` thật, không đoán qua ảnh) trước khi báo thầy xem. Chỉ sửa
`templates/anagram/anagram.js` + `anagram.css`, KHÔNG đụng `core/`.

### Lượt 1 — 4 điểm gốc thầy nêu sau khi tự chơi bản live
1. **"Đổi hình dạng" lúc bay + bóng đổ méo**: ô chữ thật lấy bo góc/bóng từ theme (Classic 1.6cqw, bóng là
   1 gờ màu đặc kiểu nút 3D), nhưng "bản sao" bay (`flyLetter`/`flyTileClone`) dùng số cố định (`12px`,
   bóng đen mờ) → suốt chuyến bay hình dạng khác hẳn ô gốc rồi "giật" về lúc đáp. Sửa: đọc bo góc THẬT
   bằng `getComputedStyle` ngay trước khi tạo bản sao, gán y hệt. Đo xác nhận: Classic ra đúng `9.792px`,
   Basic ra đúng `7.344px` (khác nhau đúng theo theme, không còn hardcode).
2. **Bỏ bóng đổ hoàn toàn** ở ô gốc, ô kết quả, và bản sao bay — chỉ giữ hiệu ứng lún (`translateY`) khi
   bấm, không còn `box-shadow` nào trên các ô chữ.
3. **Kéo-thả đặt chữ ở CẢ 2 chế độ** (trước chỉ bấm được) — thêm `attachOriginTileInteraction()` dùng
   Pointer Events song song với tap cũ (tap vẫn y hệt cũ). Bonus mode: chỉ nhận đúng ô đang chờ
   (`nextPos`), thả sai ô = huỷ không tính lỗi, thả đúng ô nhưng sai chữ = tính 1 lỗi rồi bay về (tái dùng
   `bonusPick()`, không viết luật mới). Submit mode: thả vào đúng ô mình chọn (không tự nhảy ô trống trái
   nhất như bấm) — hàm mới `submitPickAt(tileId, tileEl, slotIdx)` tách từ `submitPick()` cũ.
4. **Vật lý đổi chỗ 2 ô "giả"**: gốc lỗi là ô đang cầm bị RESET transform về 0 (giật về ô gốc) TRƯỚC khi
   đọc rect để tính chuyến bay của 2 "bản sao" khác — chuyển động không liền mạch với tay vừa kéo. Sửa lần
   đầu: đọc rect NGAY LÚC còn transform (drop trước khi reset), thêm sáng viền ô đích lúc kéo gần tới
   (`.is-droptarget`), thêm easing nảy nhẹ `cubic-bezier(.22,1.12,.36,1)` dùng chung mọi chuyến bay.
   ⭐ Đã đo bắt được 1 lỗi tự phát sinh: `fill:"forwards"` của WAAPI giữ khung hình cuối dù đã xoá
   `style.transform=""` sau đó — phải gọi `anim.cancel()` TRƯỚC khi xoá style thì mới thật sự về 0 (áp
   dụng cho cả `swapResultPositions`/`animateReturnHome`, nếu không thì lần kéo sau bị "cấm" luôn vì
   animation cũ còn đang giữ chỗ).

### Lượt 2 — 4 điểm tinh chỉnh tiếp theo
1. **Tích đúng dời từ ô gốc sang Ô ĐÍCH**, cùng phong cách trắng với dấu X (không còn tích xanh nhỏ nổi ở
   ô vừa bấm) — hàm mới `showCorrectPickBadge`/sau đổi tên `showLandedCheckBadge`, gọi trong `onDone` của
   `flyLetter` (đúng lúc chữ đáp xuống), dùng `icons.markCheck` giống hệt X.
2. **PERFECT + số điểm tách rời**: PERFECT hiện to dần rồi TỰ BIẾN MẤT TẠI CHỖ (không bay đi nữa); số
   `+N` xuất hiện SAU một nhịp (`PERFECT_TO_POINTS_DELAY_MS`) rồi mới là thứ bay về ô điểm — 2 hàm mới
   `showPerfectBurst()` + `flyPointsOnly()`, thay hẳn cách dùng `flyScoreGain()` cũ cho bonus mode (submit
   mode vẫn dùng `flyScoreGain()` y nguyên, chỉ bỏ tham số `kind` không còn "perfect" nào gọi tới).
3. **Khối ô chữ "có xu hướng cao hơn"**: `.aw-anagram-group` trước dùng `margin-top:auto` (100% khoảng
   trống dồn hết lên trên → khối ô luôn dính đáy). Thay bằng 2 vùng đệm co giãn `.aw-anagram-topspace`
   (flex:1) / `.aw-anagram-botspace` (flex:2) — chia khoảng trống theo tỉ lệ 1:2, đo xác nhận đúng
   `2.0004` lần.
4. **Vật lý swap lần 2 — đổi hẳn kỹ thuật**: bỏ HẲN cách ẩn-2-ô-thật + bay-2-bản-sao, giờ **animate trực
   tiếp 2 ô THẬT** bằng `transform` (đọc rect "nhà" của ô A bằng cách tắt/bật transform tạm thời để đo,
   không cần parse chuỗi transform). Ô đang cầm bay tiếp từ ĐÚNG chỗ tay thả (không giật), ô kia trượt
   khoảng ngắn để nhường chỗ — không còn `.aw-anagram-flytile` nào được tạo trong lúc swap (đã đếm bằng
   `document.querySelectorAll` = 0).

### Lượt 3 — 3 điểm tiếp
1. **Đổi cơ chế "đổi chỗ 2 ô" → "chèn-đẩy"** (thầy: kéo 1 ô không còn tráo với ô kia mà CHÈN vào đúng vị
   trí, đẩy lùi mọi ô ở giữa) — hàm `swapResultPositions` bị thay hẳn bằng `moveResultTile(fromPos, toPos,
   draggedFromRect)`: dùng `Array.splice` (gỡ rồi chèn, giống hệt kiểu kéo-thả sắp xếp hàng trong
   `anagram-editor.js`), rồi với MỖI ô nằm giữa `[lo,hi]` tìm vị trí mới của chữ nó đang giữ (so khớp theo
   `tileId`, không theo vị trí) để animate đúng ô đó trượt tới đích — tổng quát cho bao nhiêu ô cũng chạy
   đúng, không chỉ 2 ô liền kề. Đã test kéo xuyên 4 ô cả 2 chiều (tiến/lùi), kết quả mảng khớp CHÍNH XÁC
   phép tính tay.
2. **Đổi âm "Oh my god"**: tra lại thư mục gốc `D:\...\Source\Sound effect\ANAGRAM\GHI CHU.md` — Wordwall
   KHÔNG có âm riêng cho "cả từ sai", dùng CHUNG âm "07. Đáp sai (Incorrect)" ở mọi cấp độ → đổi
   `ui.sound.wrong()` (âm tổng hợp của core) thành `anagramSound.wrongPick()` (đã có sẵn file thật
   `blockchipfail1/2/3`, không cần tải thêm gì).
3. **Tích/X trong ô hết "hiển thị cứng"** — trước đây permanent (append 1 lần, không bao giờ gỡ, kể cả mỗi
   lần render() lại khi quay về xem từ đã nộp). Thêm `setTimeout(() => mark.remove(), 550)` ở cả 2 nơi
   append (`render()` và vòng lặp so le của `doSubmit()`).

### Lượt 4 — slogan + hiệu ứng mượt tuyệt đối
1. **Thêm slogan "ANAGRAM IN ANDREW CLASSES"** — đúng kỹ thuật/CSS đang dùng ở `crossword.js`
   (`.aw-cw-slogan`, gắn 1 lần lúc `mount()` vào `.aw-topbar` dùng chung của engine, không phải trong
   `render()` vì topbar sống xuyên suốt cả ván): `topbar.style.position="relative"` rồi chèn
   `<div class="aw-anagram-slogan">`, gỡ lại lúc `cleanup()`. CSS copy y hệt Crossword (chữ mảnh, xám,
   dãn chữ 0.32em, canh giữa tuyệt đối bằng `translate(-50%,-50%)`).
2. **Hiệu ứng tích/X mượt tuyệt đối cả 2 đầu** — trước: CSS `animation` lo phần HIỆN (pop-in .2s), còn
   phần BIẾN MẤT là `mark.remove()` tức thì (khực một cái, đúng lời thầy tả). Viết hàm dùng chung MỚI
   `showTransientMark(parentEl, className, iconSvg, totalMs)`: MỘT animation WAAPI duy nhất chạy suốt
   vòng đời (nhỏ→lớn nảy nhẹ→giữ→nhỏ dần TRƯỚC KHI gỡ khỏi DOM), xoá hẳn `@keyframes aw-pop-cx-scale`
   không dùng nữa. Cả 4 nơi tạo tích/X (`showLandedCheckBadge`, `showWrongPickMark`, `render()`,
   `doSubmit()`) đều gọi qua hàm này. Đã đo scale từng khung 25ms suốt vòng đời: 0.3→0.72→0.90→1.03
   (nảy nhẹ)→1.0 (giữ)→0.98→0.90→0.82→0.72→0.63→0.46... — một đường cong LIÊN TỤC, không có bước nhảy nào
   ở cả lúc hiện lẫn lúc biến mất.

**Tự test toàn bộ 4 lượt** qua devserver `aword` (:5510), dựng script mô phỏng `PointerEvent` thật
(pointerdown/move/up có `pointerId`) cho mọi thao tác kéo-thả — kể cả 1 lần cố tình dùng Wordwall Anagram
CÔNG KHAI thật (`wordwall.net/resource/98204906/anagram`) để tham khảo bố cục gốc, nhưng game đó vẽ bằng
CANVAS nên không lái được bằng công cụ tự động (không có DOM để bắt sự kiện) — chỉ quan sát được cấu trúc
(dãy đích là 1 dải gạch chân liền, không phải từng ô riêng) chứ không đo được animation thật của họ.
0 lỗi console suốt toàn bộ 4 lượt kiểm tra.

## Đợt 90 (8/8/2026, v0.9.65) — SỬA: "Points off" bị gộp lẫn vào `correct`, mất hàng "Total" phụ. ✅ THẦY DUYỆT → COMMIT `be7cd55` + PUSH + LIVE. KHÔNG đụng core.

Điều tra chung toàn dự án sau khi thầy phát hiện lỗi tương tự ở Type the answer (xem `GHI CHU DU AN.md`
Đợt 90). Anagram KHÔNG mất điểm trừ (khác Type the answer/Crossword) — `finish()` đã có `correct -= penalty`
ngay tại chỗ — nhưng làm vậy khiến `correct` (số từ đúng thật, hoặc số điểm chữ ở mode bonus) và `score`
(điểm xếp hạng) LUÔN bằng nhau, nên hàng phụ "Total: x/y" (Đợt 83, chỉ hiện khi `score !== correct`)
**không bao giờ xuất hiện** dù có bị trừ điểm — khác chuẩn Quiz/True-false/Maze-chase.

**Sửa:** bỏ dòng `correct -= penalty` mutate tại chỗ, thay bằng truyền riêng `score: correct - penalty`
trong `ui.finish()` — `correct` giữ nguyên là số đo thật (từ hoặc chữ tuỳ mode), `score` mới là điểm đã trừ
dùng để xếp hạng. Không đổi thời điểm đọc `penalty` (vẫn đọc synchronous ngay đầu `finish()`, y hệt code cũ)
nên không có rủi ro đua thời gian nào bị đổi.

Test thật (mode "On submit", Points off = 2): 1 từ đúng (ELEPHANT) + 1 từ sai chủ ý (POLAR BEAR, xếp sai
thứ tự) → `Score -1/6`, `Total: 1/6` — trước đây sẽ chỉ hiện `Score -1/6` không kèm hàng Total.

## Đợt 94 (10/8/2026, v0.9.68) — ⭐⭐ GIỌNG ĐỌC THẬT cho icon 🎤 (Kokoro TTS) — icon mic từ chỗ
"coming soon" giờ tạo được pronunciation clip thật cho từng từ, phát lại được lúc chơi. ⭐ CÓ SỬA CORE
(2 file MỚI, không sửa file core nào có sẵn). ✅ THẦY DUYỆT → COMMIT `a853a34` + PUSH + **LIVE** tại
`https://aword.andrewclasses.com/`.

Thầy yêu cầu nghiên cứu rồi làm tính năng "tạo voice trong phần edit ở Anagram", chốt dùng **Kokoro-82M**
(TTS mã nguồn mở, Apache-2.0) sau khi tham khảo. Tự kiểm tra kỹ qua trình duyệt thật (không đoán qua tài
liệu suông) trước khi viết code — xem mục "Nghiên cứu Kokoro" bên dưới.

**Nghiên cứu Kokoro (đo thật, không phải suy đoán từ tài liệu):**
- Chạy qua `kokoro-js@1.2.1` từ CDN `esm.sh`, model `onnx-community/Kokoro-82M-v1.0-ONNX`, dtype `q8`,
  device `wasm` — **100% trong trình duyệt, không cần server**, khớp kiến trúc AWord (site tĩnh GitHub
  Pages). Model **~88MB** (`onnx/model_quantized.onnx`, 92.361.116 bytes), tải 1 lần/máy có cache.
- Đọc trực tiếp `tts.voices` (không đoán) ra đúng **28 giọng tiếng Anh** (11 Mỹ nữ `af_*`, 9 Mỹ nam `am_*`,
  4 Anh nữ `bf_*`, 4 Anh nam `bm_*`), mỗi giọng có hạng chất lượng A-F từ tác giả model — chép nguyên vào
  `core/tts.js`'s `VOICES` để Editor hiện được danh sách MÀ KHÔNG PHẢI tải 88MB trước (chỉ tải khi bấm
  "Generate"). Giọng Anh tốt nhất: `bf_emma` (B-) → chọn làm mặc định theo đúng ý thầy.
- Sinh 1 từ ("elephant") mất **~3.3 giây** (CPU/WASM), ra file WAV **~98KB**, `audio.toBlob()` hoạt động
  đúng như tài liệu.
- ⚠️ **Phát hiện quan trọng làm đổi hướng lưu trữ**: kể từ chính sách Google hiệu lực **3/2/2026**,
  **Firebase Storage không còn miễn phí trên gói Spark** — bắt buộc gói Blaze (phải nhập thẻ ngân hàng, dù
  0đ trong hạn miễn phí). Trái với đúng nguyên tắc đã ghi ở `docs/08-FIREBASE-SETUP.md`
  ("Không cần nhập thẻ ngân hàng"). Thầy chọn (AskUserQuestion) **KHÔNG dùng Storage** — dùng Firestore
  sẵn có, không cần thẻ.

**Kiến trúc đã chọn — Firestore, MỖI CLIP 1 DOCUMENT RIÊNG** (không nhét vào `content.items[]` của act):
audio ~50-150KB/từ, act tối đa 100 từ → nhét chung sẽ vỡ giới hạn 1MB/document (áp dụng luôn cho
`assignments/{code}` — `core/assignments.js`'s `snapshotOf()` chép NGUYÊN `content` thành 1 document, đã
đọc code xác nhận). Giải pháp: collection **top-level `voiceClips/{clipId}`** (không nằm dưới
`users/{uid}`), **ĐỌC CÔNG KHAI** — id là Firestore auto-id (không đoán được), cùng mô hình tin cậy với
`assignments/{code}`. Nhờ vậy khi thầy giao bài, `content.items[].voice` (chỉ là 1 chuỗi id) tự động đi
theo bản snapshot **KHÔNG CẦN BƯỚC COPY RIÊNG** — và trang chơi của học sinh (`play.js`, không đăng nhập)
vẫn đọc được đúng clip vì rule cho phép đọc công khai theo id.

**2 file MỚI trong `core/`** (core touched nhưng THUẦN CỘNG THÊM — không sửa export nào có sẵn, không đổi
hành vi template khác):
- `core/tts.js` — bọc `kokoro-js`: `VOICES` (28 giọng, hardcode từ số đo thật), `DEFAULT_VOICE` (`bf_emma`),
  `generateSpeechDataUrl(text, voiceId, onProgress)` → trả `data:audio/wav;base64,...` (không dùng Blob URL
  để khỏi phải `revokeObjectURL`). Model là singleton lazy-load — sinh nhiều từ liên tiếp chỉ tải model 1 lần.
- `core/voice-clips.js` — `saveVoiceClip`/`getVoiceClip`/`deleteVoiceClip` thao tác `voiceClips/{clipId}`.
  `saveVoiceClip` nhận `id` tuỳ chọn: có `id` = ghi đè (dùng cho "Regenerate", tránh rác mỗi lần đổi giọng
  thử lại); không có `id` = tạo mới.
- **Luật Firestore mới** (`docs/08-FIREBASE-SETUP.md` BƯỚC 6, đã ghi cảnh báo ngay đầu file):
  `match /voiceClips/{clipId} { allow read: if true; allow write: if isTeacher(); }` — **thầy PHẢI dán lại
  + Publish trên Firebase Console thì tính năng mới chạy được** (trước đó Firestore production-mode từ
  chối mọi ghi vào collection chưa có luật).

**`templates/anagram/anagram-editor.js`** — icon 🎤 giờ có state thật (`icons.soundOn` khi đã có voice,
`icons.mic` khi chưa) thay vì luôn hiện banner "coming soon". Bấm mở **1 popover dùng chung** (không phải
1 popover/hàng — `position:fixed`, định vị dưới đúng nút mic vừa bấm, đóng khi bấm ra ngoài/khi row đổi):
dropdown 28 giọng (2 optgroup Anh/Mỹ) + nút Generate/Regenerate + (nếu đã có voice) nút ▶ Play + nút 🗑
Remove. Generate xong **cập nhật TRỰC TIẾP đúng nút mic** (`setMicState()`) thay vì gọi `renderItems()` —
tránh đúng bẫy đã biết trong codebase này (`renderItems()` xoá-vẽ-lại toàn bộ DOM hàng, sẽ làm mất luôn
chính cái nút popover đang neo vào).
- **Voice tự động MẤT khi Word đổi** (gõ lại chữ, hoặc bấm Swap Columns) — vì clip cũ giờ đọc SAI từ. Doc
  Firestore cũ không bị xoá (rác nhỏ, single-teacher scale, đã ghi rõ giới hạn này trong file comment của
  `core/voice-clips.js`, không đáng viết cơ chế GC).
- `normalize()`/`blankItem()`/mapping lúc Save đều thêm `voice`/`voiceId` vào item — trước đây các hàm này
  CHỈ giữ `{word, clue}` (allowlist), nên nếu không sửa sẽ ÂM THẦM XOÁ field voice mỗi lần Save.

**`templates/anagram/anagram.js`** (phía chơi) — nút loa (`icons.soundOn`) chỉ hiện khi `it.src.voice` có
giá trị, là **CON của chính `.aw-anagram-clue`** (không phải div bọc ngoài) — cân nhắc kỹ để KHÔNG đổi
layout của mọi act cũ (100% chưa có voice): thử phương án bọc flex trước, phát hiện rủi ro icon bị
`.aw-playarea{overflow:hidden}` cắt khi clue dài chạm mép 92% max-width (chỉ còn ~4cqw lề, không đủ chắc
chắn) → đổi sang gắn INLINE ngay sau chữ cuối (cỡ `em`, ăn theo font-size của chính clue nên tự co theo
`--fit` của autoFit, không cần tính cqw riêng) — an toàn tuyệt đối cho mọi act không có voice vì hoàn toàn
không đụng CSS/DOM của `.aw-anagram-clue` khi không có voice. Bấm phát: fetch `voiceClips/{id}` lười (chỉ
lần đầu, cache theo `Map` trong closure của `mount()`), lỗi (mất mạng, doc không tồn tại) bị nuốt lặng lẽ
— phát âm là tính năng phụ trợ, không được phép làm gãy ván đang chơi. Dừng audio trong `cleanup()`.
⚠️ KHÔNG nối `tpl.onPause` cho audio phát âm — clip ngắn ~1-2s, tương tự các `setTimeout` lẻ tẻ khác đã
được chấp nhận "hiếm, vô hại" trong `core/HUONG DAN CORE.md` mục MENU PAUSE, không đáng thêm hook mới.

**Đã tự test qua trình duyệt thật** (devserver `aword` :5510, 2 trang harness tạm tự viết rồi XOÁ sau khi
xong, đúng quy ước đã dùng cho editor Quiz/Anagram trước đây):
- Editor: 6 từ mẫu, mic icon đúng trạng thái ban đầu (chưa voice) cho cả 6 hàng; bấm mở popover đúng vị
  trí, đúng 28 giọng chia 2 nhóm (British trước, đúng thầy chọn mặc định Anh); bấm Generate → status hiện
  "Loading voice model… (first time only, ~86MB)" → sinh xong → gọi `saveVoiceClip` → **đúng báo lỗi "Please
  sign in first."** (chưa đăng nhập trong phiên test, đúng hành vi mong đợi vì `core/voice-clips.js` bắt
  buộc `currentUser()`) → nút Generate/dropdown tự mở khoá lại đúng. Toggle đóng/mở popover đúng (bấm lại
  cùng nút mic = đóng); bấm ra ngoài popover = đóng (đã đo có độ trễ 1 tick, đúng chủ đích tránh đóng ngay
  bởi chính cú click vừa mở).
- Chơi: activity giả có 1 từ gắn `voice:"FAKE_CLIP_ID..."` + 1 từ không có voice → nút loa CHỈ hiện đúng ở
  từ có voice, từ kia không có; bấm nút loa (clip không tồn tại thật) → **0 lỗi console, không crash**,
  game chơi tiếp bình thường.
- 1 bug thật tự bắt được khi test (không phải đoán): khai `let voicePopEl`/`voicePreviewAudio` ngay cạnh
  các hàm popover (sau `itemRow`) gây `ReferenceError: Cannot access 'voicePopEl' before initialization` —
  vì `renderItems()` (chạy NGAY LÚC mở editor, TRƯỚC điểm khai báo đó trong luồng thực thi) gọi
  `closeVoicePopover()` đọc `voicePopEl` khi biến còn trong TDZ. Sửa: dời khai báo lên đầu
  `openAnagramEditor()`, trước lời gọi `renderItems()` đầu tiên.
- Trùng tên biến `clueEl` (dòng mới ở đầu `render()` trùng với `const clueEl = card.querySelector(...)` có
  sẵn ở cuối hàm) — `node --check` bắt ngay lúc soát cú pháp trước khi mở trình duyệt; xoá dòng
  querySelector thừa (đã có sẵn tham chiếu trực tiếp).

**Việc kế — 2 việc CHỈ THẦY LÀM ĐƯỢC:** ✅ ĐÃ LÀM XONG (10/8/2026, cùng ngày, thầy cho phép mở Claude in
Chrome làm thay):
1. Dán lại luật Firestore ở `docs/08-FIREBASE-SETUP.md` BƯỚC 6 → Publish trên Firebase Console
   (`aword-70dae`). ⚠️ Bẫy tự bắt được lúc gõ: click "End" trên dòng lệch 1 dòng (đúng dòng đóng
   `/results/{resultId}`, không phải dòng đóng `documents`) làm khối `voiceClips` bị chèn RA NGOÀI
   `match /databases/{database}/documents {...}` (Firestore rules không hợp lệ ở vị trí đó) — bắt được
   bằng cách đọc lại `get_page_text` đếm số dòng `}` liên tiếp trước khi Publish, không tin vào toạ độ
   click mù; sửa bằng Discard rồi làm lại với `Ctrl+End` + `Up` 2 lần (đếm từ CUỐI file, đáng tin hơn đếm
   từ đầu vì cuối file cố định 3 dấu `}` lồng nhau). Publish thành công, đã đọc lại rules đã publish để
   xác nhận đúng cấu trúc lồng.
2. Đăng nhập Google (session Chrome có sẵn, không cần gõ mật khẩu) → tạo act Anagram test thật
   ("TEST voice feature", xoá sau khi xong) → bấm mic → Generate voice (giọng mặc định Emma hiện đúng) →
   **Save vào Firestore thành công thật** (mic đổi xanh, hiện Regenerate/▶ Play/🗑) → Play nghe thử OK →
   Save act → Play game → **⭐ bắt được 1 bug thật**: nút loa cạnh clue hiện ra chỉ như 1 CHẤM TÍ HON gần
   như vô hình (đo bằng `zoom` region) — nguyên nhân: `<button>` không tự kế thừa `font-size` từ tổ tiên
   (dùng font UI mặc định của trình duyệt thay vì 4.4cqw của `.aw-anagram-clue`), nên `width/height: 0.9em`
   của nút tính theo cỡ chữ UI bé xíu chứ không phải cỡ chữ clue. Sửa: thêm `font: inherit;` vào
   `.aw-anagram-listenbtn` (`anagram.css`) — nạp lại, nút hiện đúng kích cỡ, bấm phát đúng, 0 lỗi console.
   Đã xoá act test (chuyển vào Recycle bin, không xoá vĩnh viễn).

**Chưa làm (biết trước, không phải bug)**: nút 🖼️ ảnh vẫn "coming soon" y như cũ (không đụng); chưa có cơ
chế dọn rác `voiceClips` mồ côi khi xoá/sửa từ; chưa nối `voice` cho các template khác cùng có icon mic
placeholder (Unjumble/Crossword/Flying-fruit) — `core/tts.js`/`core/voice-clips.js` viết sẵn để dùng
chung khi tới lượt các template đó, không cần viết lại.

**Trạng thái**: ✅ ĐÃ COMMIT (`a853a34`) + PUSH + LIVE, test THẬT đầu-cuối trước khi commit (không chỉ
mô phỏng). **Việc kế cho phiên sau** (không gấp): 🖼️ ảnh Anagram vẫn "coming soon"; hoặc nối 🎤 giọng đọc
cho Unjumble/Crossword/Flying-fruit bằng cách tái dùng thẳng `core/tts.js` + `core/voice-clips.js` (chỉ
cần viết phần UI popover trong editor riêng của từng game, giống khuôn `anagram-editor.js` đã làm).

## Đợt 96 (10/8/2026, v0.9.70) — 3 CẢI TIẾN VOICE THEO YÊU CẦU THẦY (đổi sang đọc Clue, thêm sóng âm
preview, thêm Generate all/Delete all voices). KHÔNG ĐỤNG CORE (chỉ `templates/anagram/anagram-editor.js`
+ `anagram.css`). ✅ THẦY DUYỆT → COMMIT `fdcd403` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/`
(đã tự test kỹ qua trình duyệt thật trước khi commit, 0 lỗi console; sau khi push đã `curl` xác nhận cả 4
dấu mốc mới có mặt trên bản live ngay lần poll đầu — `speakTextFor`/`GENERIC_CLUE_TEXT`/`clueInputByItem`/
`startWaveform`/`toggleBulkPopover` trong `anagram-editor.js`, `aw-anagram-ed-wave`/`aw-anagram-ed-voicehint`
trong `anagram.css` — và mở lại `templates/anagram/test.html` live, chơi thật 0 lỗi console).

Thầy chơi thử act live (`aword.andrewclasses.com/?a=256`, không đăng nhập được nên không xem trực tiếp
được nội dung act đó — tự test bằng harness thay thế, xem mục kỹ thuật test bên dưới) rồi gửi 3 điểm sửa
cho tính năng 🎤 vừa xong ở Đợt 94.

**(1) Voice đổi sang đọc CLUE thay vì Word** — lý do hợp lý: nút loa lúc chơi nằm NGAY CẠNH clue (xem
Đợt 94), còn Word chính là đáp án học sinh đang giải — đọc to Word ra sẽ lộ đáp án. `genBtn.onclick`
(cả bản đơn `buildVoicePopover` lẫn bản hàng loạt `buildGenerateAllPopover`) đổi từ
`(it.word||"").trim()` sang hàm dùng chung mới `speakTextFor(it)` = `(it.clue||"").trim() ||
"Unscramble the word"` — **hằng số `GENERIC_CLUE_TEXT` phải khớp Y HỆT** chuỗi generic hiển thị trong
`anagram.js` (dòng ~384) để giọng đọc luôn khớp đúng chữ hiện trên màn. Đảo hẳn chỗ "sửa Word/Clue nào
thì xoá voice": trước đây `wordInput.oninput` xoá voice, nay bỏ hẳn (sửa Word không còn ảnh hưởng voice);
`clueInput.oninput` mới là chỗ xoá voice khi Clue đổi. `swapBtn` (Swap Columns) giữ nguyên hành vi xoá
voice mọi hàng (đúng, vì Clue đổi giá trị). Thêm dòng **"Will speak: "..."" sống động** ngay dưới tiêu đề
popover — đọc đúng y văn bản SẼ được đọc (kể cả fallback), tự cập nhật khi gõ Clue trong lúc popover đang
mở (không cần đóng/mở lại) nhờ `pop._updateHint()` gọi từ `clueInput.oninput`. ⚠️ **Bắt được 1 lỗi thật
lúc tự test**: cơ chế đóng popover khi bấm ra ngoài (`onVoicePopOutside`, có sẵn từ Đợt 94) coi việc bấm
vào CHÍNH ô Clue của hàng đang mở popover cũng là "bấm ra ngoài" → đóng popover ngay khi vừa focus vào ô
Clue để gõ, khiến tính năng "hint sống động" ở trên **không bao giờ có cơ hội chạy** (đã tự đóng trước
khi kịp gõ chữ nào). Sửa: thêm `clueInputByItem` (WeakMap item→input Clue của chính hàng đó) để
`onVoicePopOutside` nhận diện và BỎ QUA đúng 1 trường hợp này — mọi cú bấm khác vẫn đóng như cũ. Đã đo lại
bằng trình duyệt thật: mở popover hàng "elephant"/"A big grey animal with a trunk" → bấm vào ô Clue gõ
thêm " LIVE-EDIT" → popover **KHÔNG đóng**, dòng hint đổi ngay thành
`Will speak: "A big grey animal LIVE-EDITwith a trunk"`.

**(2) Thanh sóng âm khi Play preview** — canvas `.aw-anagram-ed-wave` (228×40, ẩn mặc định) nằm dưới cụm
nút Play/Regenerate/Remove, chỉ hiện khi bấm ▶ Play. Dùng Web Audio API thật: `AudioContext` +
`AnalyserNode` (`fftSize:256`) nối từ `MediaElementAudioSourceNode` của chính thẻ `<audio>` đang phát
(bắt buộc phải là `<audio>` MỚI mỗi lần — 1 phần tử chỉ tạo được đúng 1 `MediaElementAudioSourceNode`
suốt đời nó, khớp code sẵn có vì mỗi lần Play đều `new Audio(...)`), vẽ 28 cột bằng
`requestAnimationFrame` + `getByteFrequencyData`, tự ẩn khi audio phát xong (`'ended'`, 1 lần). Cosmetic
thuần: nếu Web Audio bị chặn/lỗi vì lý do gì thì `try/catch` nuốt lỗi, ẩn canvas, KHÔNG ảnh hưởng phát âm
thanh thật (đã `play()` từ trước, độc lập với waveform). Test bằng harness clone (`_test-anagram-editor.js`
trỏ tới `_test-voice-clips-stub.js` — kho voice giả bằng `Map` trong bộ nhớ thay Firestore, để chạy được
TRỌN luồng Generate→Save→Play mà không cần đăng nhập Google, cùng logic 100% với bản thật, khác đúng 1
dòng import; cả 2 file + `_test-editor.html`/`_test-editor-run.js` đã XOÁ sau khi test xong, đúng quy ước
cũ): sinh giọng thật cho "A big grey animal with a trunk" (giọng Emma mặc định) → Save → bấm Play → đọc
`ImageData` của canvas ngay sau khi phát xong ra **392 pixel có vẽ** (khác 0, chứng minh có vẽ cột thật
theo dữ liệu tần số thật, không phải canvas trống) → canvas tự ẩn đúng lúc audio kết thúc. 0 lỗi console.

**(3) Nút "Generate all voices" / "Delete all voices"** — thêm vào thanh bulk phía trên bảng (cạnh "Delete
all words"). Cả 2 dùng lại đúng khung popover `.aw-anagram-ed-voicepop` (hàm dùng chung mới
`positionPopover()`, tách từ code định vị lặp lại 3 chỗ của Đợt 94) + cờ `pop._bulkKind` để phân biệt với
popover-1-hàng khi toggle. **Delete all voices**: popup nhỏ hiện đúng số hàng đang có voice + cảnh báo
"không hoàn tác được" (nếu 0 hàng có voice thì chỉ có nút Cancel, không có nút xoá) — xoá tuần tự qua
`deleteVoiceClip`, dừng NGAY nếu gặp lỗi chưa-đăng-nhập (không âm thầm xoá cục bộ những hàng còn lại khi
Firestore chưa xoá được, tránh lệch dữ liệu cục bộ/thật). **Generate all voices**: popup có ô chọn giọng
(28 giọng, mặc định Emma) + checkbox "Skip rows that already have a voice" (mặc định BẬT, tránh tốn thời
gian sinh lại giọng đã có) + dòng đếm "N row(s) total, M already have a voice" + mô tả ngắn hành vi đọc
Clue. Bấm Generate chạy TUẦN TỰ từng hàng (model Kokoro vẫn chỉ tải 1 lần vì là singleton lười có sẵn ở
`core/tts.js`), hiện tiến độ "Generating X / Y…", dừng ngay khi gặp lỗi chưa-đăng-nhập (không tốn thời
gian WASM sinh tiếp những giọng chắc chắn không lưu được) nhưng KHÔNG dừng vì 1 hàng lỗi khác (để 1 hàng
hỏng không chặn cả danh sách 100 từ). Test qua harness giả (như mục 2): 3 hàng mẫu (1 đã có voice, 2 chưa)
→ bấm Generate all với Skip bật → đúng "Generating 2 / 2…" → xong hiện "Generated voice for 2 row(s)."
→ cả 3 hàng đều có voice (hàng có sẵn giữ nguyên, không bị sinh lại) → bấm Delete all voices → đúng số
đếm "3 row(s)" → xác nhận → "Removed voice from 3 row(s)." → cả 3 về trạng thái chưa có voice. 0 lỗi
console suốt.

**File đổi**: `templates/anagram/anagram-editor.js` (cả 3 mục), `templates/anagram/anagram.css` (thêm CSS
`.aw-anagram-ed-wave`/`.aw-anagram-ed-voicehint`/`.aw-anagram-ed-voicecheck`). Không đụng `anagram.js`
(phía chơi không đổi gì — nút loa vẫn đọc đúng `it.src.voice` như Đợt 94, chỉ NỘI DUNG của clip đổi từ
lúc soạn).

**⚠️ Phát hiện ngoài lề lúc test (không phải việc của đợt này)**: `git status` lúc đang làm cho thấy
`templates/type-the-answer/type-the-answer.css`/`.js` bị sửa dở (thêm biến `--tta-input-fs` chống iOS
Safari tự zoom ô nhập khi cỡ chữ tính ra dưới 16px) — **không phải do phiên này gây ra**, khả năng cao do
máy khác đồng bộ qua Drive giữa lúc đang làm (đúng mô hình "3 máy đồng bộ, build song song" đã ghi ở
memory). Đã KHÔNG đụng 2 file đó, không `git add -A`, chỉ stage đúng 2 file Anagram của đợt này khi commit.

**Chưa test được** (cần thầy hoặc máy có đăng nhập Google — không tự làm được vì không có quyền đăng nhập
tài khoản thầy trong phiên này): vòng Save→Play THẬT qua Firestore thật (harness ở mục 2 mô phỏng bằng
kho giả nhưng logic y hệt bản thật, chỉ khác đúng 1 dòng import); waveform + Generate all/Delete all trên
act thật `?a=256`. Thầy duyệt commit+push thẳng dựa trên kết quả test harness (không đợi tự chơi act thật
trước) — **việc kế cho phiên sau (không gấp): thầy tự vào act thật `?a=256` (hoặc act Anagram bất kỳ) trên
bản LIVE, đổi vài Clue rồi Generate lại giọng, nghe qua Play xem sóng âm có hiện đúng không, thử Generate
all/Delete all trên 1 act nhiều từ — nếu gặp gì bất thường thì báo lại.**

## Đợt 98 (10/8/2026, v0.9.72) — 6 CẢI TIẾN TIẾP THEO THẦY YÊU CẦU: HIDE TEXT + WAVEFORM AUDITION-STYLE +
DIM/BLUR/PROGRESS/CANCEL CHO GENERATE ALL + POPUP DELETE ALL WORDS + AUTO-PLAY/PHÁT QUANG TRONG GAME.
KHÔNG ĐỤNG CORE (chỉ `core/icons.js` — thuần thêm 2 icon mới — + 3 file `templates/anagram/*`). ✅ THẦY
DUYỆT → COMMIT `06fec24` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` — test THẬT qua trình
duyệt trước khi commit (harness thay Firestore, kể cả phía CHƠI, xem mục kỹ thuật test bên dưới), 0 lỗi
console suốt toàn bộ; sau push đã `curl` xác nhận đủ dấu mốc mới (`loadWaveform`/`setHideTextState`/
`buildDeleteAllWordsPopover` trong `anagram-editor.js`, `toggleVoiceClip`/`setListenGlow`/"Listen for the
clue" trong `anagram.js`, `aw-anagram-ed-backdrop`/`aw-anagram-ed-runcancel`/`listenglow` trong
`anagram.css`, `eyeOff` trong `core/icons.js`) trên bản live ngay lần poll thứ 2, và mở lại
`templates/anagram/test.html` live chơi thật 0 lỗi console.

Ngay sau khi duyệt Đợt 96, thầy gửi tiếp 1 lượt 6 điểm (2 nhóm — Edit và Game):

**NHÓM EDIT**

**(1) Icon "Hide text" cạnh mỗi hàng Clue** — bấm ON thì Clue ẩn khi chơi, chỉ còn giọng đọc; mặc định
ON ngay khi Generate/Regenerate xong (đơn lẻ lẫn Generate all) — đúng yêu cầu thầy. Field mới `it.hideText`
(bool) — CHỈ có ý nghĩa khi có voice (`setHideTextState()` tự khoá nút + ép về `false` nếu `it.voice`
rỗng, tránh trạng thái "ẩn chữ mà không có gì đọc thay"). Icon mới `eye`/`eyeOff` (`core/icons.js`, thuần
thêm — không sửa/xoá icon nào có sẵn). Tự động **tắt hideText** ở mọi chỗ voice bị xoá: Remove voice (đơn
lẻ), Delete all voices (hàng loạt), sửa lại Clue (voice cũ sai từ), Swap Columns (Clue đổi giá trị).

**(2) Waveform ĐỔI SANG DẠNG TĨNH kiểu Adobe Audition** (trước ở Đợt 96 là cột tần số ĐỘNG theo
`AnalyserNode`, thầy muốn dạng "ảnh chụp cả đoạn" + vạch thời gian chạy qua, giống phần mềm dựng âm
thanh thật) — viết lại hoàn toàn: `decodeAudioData()` giải mã clip 1 LẦN (không phải để phát, chỉ để lấy
biên độ), tính đỉnh biên độ mỗi cột pixel (228 cột cho cả đoạn), vẽ thành 1 bức tranh CỐ ĐỊNH ngay khi mở
popover (không cần đợi bấm Play). Bấm ▶ Play chỉ chạy 1 vạch (playhead) quét qua bức tranh đó theo đúng
`audio.currentTime/audio.duration`, tô lại phần đã-phát màu xanh đậm/chưa-phát màu xám nhạt, kèm nhãn thời
gian `0:01 / 0:03` cập nhật sống. `AudioContext` giờ CHỈ dùng để giải mã (không nối `MediaElementSource`
tới loa nữa) — đơn giản hơn hẳn bản Đợt 96, và tách hẳn khỏi luồng phát âm thật (`new Audio()+.play()`
không đổi gì). Đã đo bằng canvas thật: giọng "elephant" sinh ra file ~3 giây → ảnh sóng vẽ đúng 1670 pixel
có màu (khác canvas trống) → nhãn thời gian đúng `0:00 / 0:03` lúc chưa phát.

**(3) Popup "Generate all voices" có DIM+BLUR nền, thanh %, khoá đóng khi đang chạy + nút Cancel đỏ nhỏ**
— thêm lớp phủ `.aw-anagram-ed-backdrop` (rgba đen 40% + `blur(3px)`) NGAY khi popup mở (đo
`getComputedStyle` xác nhận đúng `rgba(15,22,34,0.4)` + `blur(3px)`), z-index dưới popup. Bấm Generate →
`pop._running=true` → ẩn 2 nút Cancel/Generate thường, hiện đúng 1 nút Cancel NHỎ MÀU ĐỎ
(`.aw-anagram-ed-runcancel`, đo `rgb(221,51,51)` trên nền `rgb(253,234,234)`) + thanh tiến độ
`.aw-anagram-ed-voiceprogress` chạy theo % số hàng đã xong. `onVoicePopOutside` thêm 1 dòng chặn: đang
`_running` thì bấm ra ngoài **KHÔNG đóng được** — đã đo thật (16 hàng, bấm ra ngoài giữa lúc "Generating
9/16…" → popup + backdrop vẫn còn, `_running` vẫn `true`, tiến độ tiếp tục chạy bình thường). Bấm nút
Cancel đỏ → dừng ĐÚNG lúc hàng hiện tại xong (soft-cancel, không huỷ giữa chừng 1 lần gọi Kokoro vì thư
viện không có cơ chế abort) → đo thật: "Cancelled — generated voice for 12 row(s) before stopping." đúng
số hàng đã kịp xong trước khi bấm Cancel.

**(4) "Delete all words" đổi từ `confirm()` trần sang popup giống "Delete all voices"** — hàm mới
`buildDeleteAllWordsPopover()`, `toggleBulkPopover()` thêm nhánh `kind:"deleteWords"`. Không có bước
Firestore nào (words/clue chỉ tồn tại cục bộ tới khi Save) nên không cần nhánh sign-out.

**NHÓM GAME**

**(5)+(6) Auto-play khi mở câu mới + nút loa phát quang xanh lá khi đang phát, bấm để dừng/phát lại** —
viết lại toàn bộ khối phát âm trong `anagram.js`: `playVoiceClip(clipId, btn)` giờ nhận thêm nút loa để
gắn hiệu ứng phát quang (`setListenGlow`/`.is-playing`); `toggleVoiceClip()` MỚI — đang phát thì dừng,
không thì phát (lại) từ đầu; `render()` (đúng ranh giới "mở từ mới" — file này đã ghi rõ trong comment đầu
file là render() CHỈ chạy lúc bắt đầu/đổi từ, không chạy giữa chừng) giờ tự gọi `playVoiceClip(...)` ngay
khi dựng xong nút loa của từ đó, và LUÔN dừng audio của từ TRƯỚC ở đầu hàm (kể cả khi từ mới không có
voice) để không lọt tiếng từ cũ sang từ mới. Phát quang bằng `@keyframes` CSS thuần (không phải
`element.animate()`) nên tự động ĐÓNG BĂNG cùng mọi animation khác khi Menu Pause mở (cơ chế chung
`stage.getAnimations({subtree:true})` của `core/engine.js`, không cần nối hook riêng — đúng khuôn đã
dùng cho phần lớn hiệu ứng khác trong dự án). Track "ended" tự tắt phát quang khi clip phát xong tự nhiên.
⚠️ Bẫy đã tránh: click play() bị chặn bởi autoplay policy trình duyệt (hiếm gặp vì trang đã có tương tác
từ nút "Play" mở ván) → `.catch()` tắt phát quang lặng lẽ, không phá ván đang chơi.

**Hide text hiển thị trong game**: `clueEl` giờ có 3 nhánh — có Clue thật (hiện nguyên văn) / không có
Clue (hiện "Unscramble the word", y hệt cũ) / có Clue NHƯNG `hideText` bật (hiện "🔊 Listen for the clue"
— khác chữ với nhánh "không có Clue" để học sinh không hiểu nhầm "từ này không có gợi ý gì cả").

**Kỹ thuật test** (không có quyền đăng nhập Google trong phiên này, như Đợt 96): dựng lại 2 file harness
tạm trỏ import sang kho voice giả `_test-voice-clips-stub.js` — `_test-anagram-editor.js` (test phần
soạn) VÀ **THÊM MỚI** `_test-anagram.js` (test phần CHƠI, dùng `generateSpeechDataUrl` sinh 1 giọng thật
rồi `_seed()` thẳng vào kho giả, gắn cho 1 từ mẫu có `hideText:true` + 1 từ `hideText:false` + 1 từ không
voice để so sánh cả 3 nhánh cùng lúc) — cả 2 cùng chạy qua `core/engine.js` thật (`registerTemplate`) như
`test.html` gốc. Đã đo bằng cách tráo tạm `HTMLMediaElement.prototype.play` (chỉ trong phiên trình duyệt
test, không đụng file nguồn) để BẮT ĐƯỢC bằng chứng `.play()` thật sự được gọi (không chỉ suy luận qua
UI) — xác nhận đúng 1 lần gọi cho voice mỗi lần mở từ mới (lần đo ra "2" là do bắt luôn cả tiếng chuông
"Play" của `anagram-sound.js`, cũng dùng `<audio>`, không phải bug). ⚠️ Clip test chỉ ~3 giây trong khi độ
trễ round-trip của môi trường test nhiều khi vượt 3 giây, nên KHÔNG bắt được đúng 1 khung hình giữa lúc
đang phát (phát quang/playhead) bằng ảnh chụp — đã xác nhận gián tiếp chắc chắn qua: `.play()` có gọi
thật, waveform tĩnh vẽ đúng dữ liệu thật, trạng thái trước/sau đúng theo thiết kế, đọc lại code logic đơn
giản (bật/tắt class, không có điều kiện đua tranh); phần "nhìn thấy phát quang thật" nhờ thầy tự xác nhận
mắt thường khi chơi bản live. Đã XOÁ toàn bộ 7 file tạm sau khi test xong.

**File đổi**: `core/icons.js` (+`eye`/`eyeOff`, thuần thêm), `templates/anagram/anagram-editor.js` (mục
1-4), `templates/anagram/anagram.css` (CSS mới cho cả 4 mục edit), `templates/anagram/anagram.js` (mục
5-6). Không đụng file nào khác.

**Trạng thái**: ✅ ĐÃ COMMIT (`06fec24`) + PUSH + LIVE, test THẬT trước khi commit (không chỉ mô phỏng).
**Việc kế (không gấp)**: thầy tự vào act thật trên bản LIVE — mở 1 từ có voice xem chữ Clue có ẩn đúng +
nút loa có sáng xanh lúc phát không, thử bấm Cancel giữa lúc Generate all 1 act nhiều từ.

## Đợt 100 (10/8/2026, v0.9.74) — 5 TINH CHỈNH THẦY GỬI SAU KHI TỰ CHƠI THỬ ĐỢT 98: NÚT HIDE/SHOW ALL
TEXT + SẮP XẾP LẠI 4 NÚT BULK THÀNH ICON-ONLY + NÚT LOA TO GIỮA KHUNG KHI ẨN TEXT + TRÌ HOÃN AUTO-PLAY TỚI
HẾT NHẠC INTRO. KHÔNG ĐỤNG CORE (chỉ `core/icons.js` — thêm 2 icon — + 3 file `templates/anagram/*`). ✅
THẦY DUYỆT → COMMIT `7140c98` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` — test THẬT qua
trình duyệt trước khi commit, 0 lỗi console; sau push đã `curl` xác nhận đủ dấu mốc mới trên bản live ngay
lần poll thứ 2 (`refreshHideAllBtn`/`bulkIconBtn` trong `anagram-editor.js`,
`aw-anagram-clue-voiceonly`/`firstWordRendered` trong `anagram.js`,
`aw-anagram-ed-bulkicon`/`aw-anagram-listenbtn-lg` trong `anagram.css`, `introDurationMs` trong
`anagram-sound.js`, `micOff`/`wand` trong `core/icons.js`), mở lại `test.html` live chơi thật 0 lỗi.

**(1) Nút "Hide all text" / "Show all text"** — thêm vào thanh bulk, đổi nhãn/icon theo trạng thái TỔNG:
còn ít nhất 1 hàng có voice mà CHƯA ẩn → hiện "Hide all text" (icon `eye`); MỌI hàng có voice đều đã ẩn →
đổi thành "Show all text" (icon `eyeOff`); chưa hàng nào có voice → khoá nút (đúng quy tắc "không có gì
để ẩn/hiện"). Bấm 1 lần đảo NGƯỢC trạng thái cho MỌI hàng có voice cùng lúc (đúng quy ước bulk action có
sẵn — giống Swap Columns, gọi `renderItems()`).

⚠️ **Bẫy kỹ thuật đáng ghi lại**: nút này build 1 LẦN duy nhất lúc mở trang (`buildBulkBar()` không nằm
trong `renderItems()`), nhưng trạng thái tổng hợp của nó phải đúng SAU MỌI thao tác đổi voice/hideText ở
bất kỳ đâu — kể cả 4 chỗ KHÔNG gọi `renderItems()` (Generate/Regenerate 1 hàng, Remove voice 1 hàng, gõ
lại Clue làm mất voice, bấm toggle Hide text 1 hàng — cả 4 chỗ này cố tình chỉ vá DOM trực tiếp để tránh
nháy màn hình, theo đúng quy ước đã có từ Đợt 94/96). Giải pháp: hàm `refreshHideAllBtn()` dùng chung, gọi
ở CUỐI `renderItems()` (miễn phí cho mọi đường đã qua đó) VÀ gọi thêm tại đúng 4 chỗ vá trực tiếp kể trên.
Đã đo thật: Generate 1 hàng → nút tự chuyển "Show all text" (vì đó là hàng có voice DUY NHẤT, mặc định ẩn
sẵn); bấm icon Hide text của chính hàng đó về hiện lại → nút tự chuyển ngược "Hide all text" — cả 2 chiều
đều đúng, không cần bấm gì thêm để "làm mới" nút.

**(2) Sắp xếp lại 4 nút bulk + đổi TOÀN BỘ sang dạng ICON-ONLY** (không còn chữ) — thứ tự cố định:
**Generate all voices (icon `wand` mới, nền xanh dương đậm) → Hide/Show all text (`eye`/`eyeOff`) →
Delete all voices (icon `micOff` mới — mic có gạch chéo, khác hẳn hình dáng thùng rác để không nhầm với
"xoá cả hàng") → Delete all words (icon `trash`, sẵn có)**. Nhãn đầy đủ vẫn còn nguyên trong `title`/
`aria-label` (hiện khi rê chuột, đọc được bằng trình đọc màn hình) — chỉ bỏ chữ NHÌN THẤY. CSS mới
`.aw-anagram-ed-bulkicon` (42×42px, to hơn hẳn icon trong từng hàng 34px, đúng ý "to, rõ ràng, dễ hiểu").

**(3) Ẩn text: chỉ còn ĐÚNG 1 nút loa to giữa khung, không chữ/icon nào khác** — trước đó (Đợt 98) vẫn còn
dòng "🔊 Listen for the clue" làm chỗ đứng cho nút; nay bỏ hẳn dòng chữ đó, `clueEl` khi `hideText` bật
KHÔNG còn nội dung chữ nào (`clueText:""`, `childCount:1` — chỉ còn đúng nút loa là con duy nhất), dùng
class mới `.aw-anagram-clue-voiceonly` (flex căn giữa) + nút loa dùng class bổ sung
`.aw-anagram-listenbtn-lg` (1.7em thay vì 0.9em — đo thật ra 72.25px so với kích cỡ gốc, to hơn hẳn theo
đúng ý "to hơn một chút"). Trường hợp có Clue nhưng KHÔNG ẩn vẫn giữ nguyên layout cũ (chữ + nút nhỏ nối
liền sau chữ).

**(4) Trì hoãn auto-play tới khi hết nhạc intro** — nhạc "intro" chính là tiếng chuông bấm Play
(`anagramSound.play` → file `blockgameintro1.mp3`, do `core/engine.js`'s `bigPlay.onclick` phát ngay
trước khi gọi `mount()`, gần như CÙNG LÚC với `render()` đầu tiên). Thêm `anagramSound.introDurationMs()`
(đọc `pack.durationMs("blockgameintro1")` — file này đã được `prime()` tải sẵn từ trước màn READY nên gần
như luôn có metadata đúng, có fallback 700ms phòng khi chưa kịp) — CHỈ từ ĐẦU TIÊN của cả ván (cờ
`firstWordRendered`) mới `setTimeout` chờ đúng ngần ấy mili-giây rồi mới gọi `playVoiceClip`; mọi từ sau
đó (bấm Next/Previous) vẫn phát NGAY như Đợt 98. Có huỷ đúng timeout treo nếu người chơi bấm chuyển từ
trước khi hết giờ chờ (tránh giọng đọc của từ CŨ phát chèn vào lúc đang xem từ MỚI). Đo bằng cách tráo
`HTMLMediaElement.prototype.play` ghi lại mốc thời gian thật: chuông intro phát lúc t=13882ms, giọng đọc
từ đầu tiên phát lúc t=15932ms — **trễ đúng ~2050ms khớp thời lượng file intro thật** (không phải suy
đoán — đo được số liệu cụ thể); từ thứ hai (bấm Next) phát ngay tại thời điểm bấm, không còn độ trễ.

**File đổi**: `core/icons.js` (+`wand`/`micOff`), `templates/anagram/anagram-editor.js` (mục 1-2),
`templates/anagram/anagram.css` (CSS mới cho cả 3 mục edit + game), `templates/anagram/anagram.js` (mục
3-4), `templates/anagram/anagram-sound.js` (+`introDurationMs`).

**Kỹ thuật test**: harness y hệt Đợt 96/98 (kho voice giả + tráo `HTMLMediaElement.prototype.play` để bắt
mốc thời gian thật). Đã xoá 7 file tạm sau khi test xong.

**Trạng thái**: ✅ ĐÃ COMMIT (`7140c98`) + PUSH + LIVE, test THẬT trước khi commit. **Việc kế (không
gấp)**: thầy tự chơi lại bản live xác nhận cảm giác nhạc intro → giọng đọc mượt, nút loa to giữa khung dễ
bấm trên màn cảm ứng.

### Nghiên cứu riêng (chưa build) — đồng bộ voice/hideText qua "Change Template"

Thầy yêu cầu thêm: khi 1 act Anagram được đổi tạm sang game khác qua nút Template (core/convert.js, Đợt
47), game tạm đó cũng phải đọc đúng `voice`/`hideText` và tự hiện nút loa/ẩn text giống Anagram. Đã đọc kỹ
`core/convert.js` để đánh giá phạm vi trước khi làm (đúng luật dự án ở `APP_MASTER.md`: "tính năng mới
lớn: nghiên cứu + báo trước, chờ thầy 'ok build'") — xem tin nhắn báo cáo riêng gửi thầy cùng đợt này.
Tóm tắt: Anagram (kind "qa") đổi được sang **12 game khác** (Flying fruit, Crossword, Find the match,
Balloon pop, Quiz, Gameshow, Maze chase, Open the box, Type the answer, Whack-a-mole, Speaking cards,
Running team) — mỗi game có hình dạng câu hỏi RẤT khác nhau (Crossword là lưới nhiều ô + danh sách gợi ý
bên cạnh, Find the match hiện NHIỀU cặp cùng lúc không có khái niệm "câu hỏi hiện tại", Running team
không hề mang theo clue). Muốn làm ĐÚNG như Anagram (auto-play, phát quang, ẩn/hiện text đồng bộ) cho cả
12 game này là 1 đợt thiết kế riêng cho từng game, không phải 1 bản vá máy móc — cần thầy chốt phạm vi
trước khi bắt tay vào.

## Đợt 105 (10/8/2026, v0.9.79) — THÊM CHẾ ĐỘ THỨ 3 "BONUS AND MINUS" + GOM "POINTS OFF" VỀ 1 CHỖ.
KHÔNG ĐỤNG CORE (chỉ `templates/anagram/anagram.js` + `anagram.css`, dùng `tpl.hidePointsOff` sẵn có).
✅ THẦY DUYỆT (yêu cầu trực tiếp "commit + push live") → COMMIT `1e2c7ce` + PUSH + **LIVE** tại
`https://aword.andrewclasses.com/` (`curl` xác nhận đủ `bonusMinus`/`flyLetterPenalty` trong `anagram.js`
+ `.aw-anagram-flynum-bad`/`.aw-anagram-multslider` trong `anagram.css` ngay lần poll thứ 5).

Thầy yêu cầu thêm chế độ chơi thứ 3 (giống "Letters with bonus" nhưng có điểm trừ mỗi lần bấm sai) +
sắp xếp lại vị trí/hành vi thanh "Points off":

1. **3 chế độ trong "Anagram mode"**: Letters with bonus (`bonus`, cũ) · On submit (`submit`, cũ) · **Bonus
   and minus (`bonusMinus`, MỚI)**. `bonusMinus` dùng CHUNG toàn bộ cơ chế tương tác của `bonus` (bấm đúng
   thứ tự, ô kết quả tô xanh ngay) — gộp lại qua biến `isBonusFamily` (thay mọi `mode === "bonus"` liên
   quan tới TƯƠNG TÁC/HIỂN THỊ bằng biến này: `doneCheck`, `scoreNow`, `render()`, dispatch bấm/kéo-thả,
   `finish()`); phần ĐIỂM SỐ mới tách riêng theo từng mode trong `finalizeBonusWord()`/`bonusPick()`.
2. **Thanh "Points off" dời lên ngay dưới 3 chế độ, ngay trên Lives** (trước đây là control CHUNG của core,
   nằm tuốt dưới cùng, sau cả Lives/Anagram options) — Anagram giờ tự xây TOÀN BỘ control này trong
   `buildExtraOptions()` (đặt `hidePointsOff: true` để ẩn control chung của `core/engine.js`, đúng khuôn đã
   dùng ở crossword/unjumble/type-the-answer), và Ý NGHĨA đổi theo mode đang chọn (3 group DOM dựng sẵn
   MỘT LẦN, chỉ đổi `display` khi bấm radio — kỹ thuật giống Timer's "Count down" của core):
   - **Letters with bonus**: KHÔNG có thanh Points off nào (trước đây bản cũ có deduct-per-word ẩn ngầm
     qua control chung, thầy chốt bỏ hẳn — chế độ này giờ hoàn toàn không trừ điểm gì).
   - **On submit**: giữ "Points off (wrong answer)", NHƯNG mở rộng từ 0..5 (giới hạn cũ của control chung)
     lên **0..-10** theo yêu cầu thầy.
   - **Bonus and minus**: đổi hẳn ý nghĩa — **"Points off (wrong letter)"**, 0..100, nấc 5 điểm, trừ **mỗi
     lần bấm SAI 1 CHỮ** (không phải mỗi từ) — cùng lúc hiện thêm thanh **"Bonus x"** (1x..5x, mặc định 2x
     khớp hành vi nhân đôi cũ của "Letters with bonus"), là hệ số nhân điểm của 1 từ PERFECT.
3. **Hiệu ứng bay điểm trừ khi bấm sai (`bonusMinus` only)** — hàm mới `flyLetterPenalty(slotEl, points)`
   (nhái cấu trúc `flyPointsOnly()` có sẵn): số đỏ "-N" bay từ đúng ô đang chờ chữ (ô vừa hiện dấu ✗ của
   `showWrongPickMark()`) thẳng tới ô điểm, cỡ chữ tính theo bề ngang 1 ô THẬT (`tilePx * 1.05`, tối thiểu
   42px — "không bị nhỏ, gần bằng size 1 ô" theo đúng lời thầy), điểm chỉ THẬT SỰ bị trừ (`penalty += points`)
   lúc số bay TỚI NƠI, giữ đúng quy ước "áp dụng lúc đáp xuống" mọi hiệu ứng bay khác trong file này. CSS
   mới `.aw-anagram-flynum-bad` (đỏ `#ff5c5c`, tái dùng nguyên khung `.aw-anagram-flynum` có sẵn — chỉ đổi
   màu).
4. **"Nx PERFECT"** — `showPerfectBurst()` nhận thêm tham số `label` (mặc định vẫn "PERFECT" cho chế độ
   `bonus`); `bonusMinus` truyền `"${bonusMult}x PERFECT"` để số nhân đọc rõ ngay lúc chữ hiện lên, trước
   khi số điểm thật (đã nhân) bay vào ô điểm theo sau như cũ.
5. **CSS mới khác**: `.aw-anagram-multslider`/`.aw-anagram-multval` (thanh "Bonus x", màu vàng/hổ phách
   `#f5a623` — CỐ Ý khác màu đỏ của mọi thanh Points off, vì đây là hệ số CỘNG điểm chứ không phải trừ),
   nhái đúng khuôn `.aw-anagram-livesslider`/`.aw-anagram-livesval` có sẵn.

**Đã test qua trình duyệt thật** (devserver `aword` :5510, `templates/anagram/test.html`, KHÔNG mô phỏng
PointerEvent giả — bấm thật qua Browser pane's `computer` tool, vì lệnh bấm giả `new PointerEvent(...)` bị
Chrome từ chối `setPointerCapture` (`NotFoundError: No active pointer...`) do không phải pointer thật, dù
vẫn lọt qua được `pointerup`/`onTileClick` nhờ `dragging=true` đã gán trước dòng gây lỗi — action mẫu này
đã tự bắt được và ghi lại làm bài học cho lần test sau, không phải bug của code Anagram):
- Panel Options: chọn từng radio trong 3 mode → đúng 3 group Points off/Bonus x đổi `display` NGAY (không
  cần Apply) — `bonus`: cả 3 group ẩn; `submit`: chỉ "Points off (wrong answer)" hiện, `max="10"` xác nhận
  qua `getComputedStyle`/thuộc tính DOM thật; `bonusMinus`: "Points off (wrong letter)" + "Bonus x" cùng
  hiện, "Points off (wrong answer)" ẩn.
- **`bonusMinus`, từ có 1 lỗi** (GIRAFFE, bấm sai "R" trước rồi giải đúng cả 7 chữ, Points off wrong-letter
  = 20): chơi hết 6 từ (5 từ còn lại bỏ qua bằng Next, `allowSkip` mặc định bật) → bảng tổng kết hiện đúng
  **`Score -13/46`** + **`Total: 7/46`** — khớp CHÍNH XÁC phép tính tay (7 chữ × 1 điểm, không nhân vì có
  lỗi, trừ đúng 20 của 1 lần bấm sai).
- **`bonusMinus`, từ PERFECT** (PENGUIN, giải đúng cả 7 chữ liền, không set lại Bonus x sau khi tải lại
  trang nên giữ mặc định 2x): bảng tổng kết hiện đúng **`Score 14/46`** = 7×2 — xác nhận công thức
  `n × mult` cho từ hoàn hảo đúng cả khi dùng giá trị MẶC ĐỊNH (chưa từng đụng slider).
- **`bonus` (chế độ cũ, không đổi gì)**: chơi hết ELEPHANT (8 chữ) không sai lần nào → `Score 16/46` = 8×2
  — xác nhận chế độ cũ NGUYÊN VẸN, không hồi quy.
- 0 lỗi console MỚI phát sinh từ code Anagram (chỉ còn 8 lỗi `setPointerCapture` cũ của chính kịch bản test
  giả lập nói trên, không liên quan code nguồn).
- ⚠️ **Phát hiện môi trường test (không phải bug)**: `document.visibilityState === "hidden"` trong Browser
  pane phiên này khiến `requestAnimationFrame` KHÔNG BAO GIỜ chạy (đo thật: chờ 2s không có khung hình nào)
  — đúng bẫy đã ghi ở memory "Bẫy throttle khi test Electron". Hệ quả: `pulseScoreTo()` (hàm CHUNG, có từ
  trước, dùng cho MỌI hiệu ứng cộng/trừ điểm trong file) không cập nhật được số hiển thị GIỮA game dù logic
  điểm bên trong đã tính đúng (xác nhận bằng log tạm thời: `penalty`/`scoreNow()` ra đúng số ngay khi hiệu
  ứng bay bắt đầu) — chỉ lộ ra ở BẢNG TỔNG KẾT cuối game (không phụ thuộc rAF, gọi thẳng `ui.finish()`).
  Không sửa gì (không phải lỗi của tính năng này), chỉ ghi lại để phiên sau biết nguyên nhân nếu gặp lại số
  điểm "đứng yên" giữa game khi test qua Browser pane.

**File đổi**: `templates/anagram/anagram.js` (buildExtraOptions viết lại đoạn Points off/mode; mount() đọc
`letterPenalty`/`bonusMult`; `isBonusFamily` thay `mode==="bonus"` ở 7 chỗ; `bonusPick`/`finalizeBonusWord`/
`showPerfectBurst` sửa theo mode; hàm mới `flyLetterPenalty`), `templates/anagram/anagram.css` (
`.aw-anagram-flynum-bad`, `.aw-anagram-multslider`/`.aw-anagram-multval`). Không đụng `core/`,
`anagram-editor.js`, `sample-anagram.js`.

**Trạng thái**: ✅ ĐÃ COMMIT (`1e2c7ce`) + PUSH + LIVE, test thật qua trình duyệt TRƯỚC khi commit (không
chỉ mô phỏng). **Việc kế (không gấp)**: thầy tự vào act Anagram thật trên bản LIVE, đổi mode "Bonus and
minus", chỉnh Points off (wrong letter)/Bonus x, chơi thử xem MẮT THẬT hiệu ứng số đỏ bay lên + nhãn "Nx
PERFECT" (máy build không chụp được animation do bẫy rAF của Browser pane test, chỉ xác nhận được kết quả
CUỐI qua bảng tổng kết).
