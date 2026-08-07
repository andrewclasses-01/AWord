# GHI CHÚ — TEMPLATE OPEN THE BOX

## TRẠNG THÁI: 🟢 CHỜ THẦY DUYỆT — 7/8/2026 (Đợt 26, v0.9.63 dự kiến) — SỬA 2 LỖI "Ô SỐ FADE KHỰC MỘT CÁI" KHI CHẠM SỚM. KHÔNG ĐỤNG CORE. (mới ở LOCAL, chưa commit)

## Đợt 26 (7/8/2026, v0.9.63 dự kiến) — SỬA 2 LỖI SNAP KHI FADE LƯỚI Ô SỐ — 🟢 CHỜ THẦY DUYỆT (chưa commit)

> Chỉ sửa 2 file template: `open-the-box.js` (trong `animateOpen()`) + `open-the-box.css` (keyframe
> `aw-otb-box-fade-out`). **KHÔNG đụng core.** Thầy báo: "khi chọn 1 ô số, các ô số khác đáng lẽ fade dần
> nhưng có trường hợp lại xuất hiện hoặc biến mất khực một cái, không mượt."

### Điều tra — 2 lỗi RIÊNG BIỆT, cùng một họ (đổi animation CSS giữa chừng làm trình duyệt nhảy về giá trị
### `from` thay vì tiếp tục mượt từ vị trí hiện tại), nhưng ở 2 tình huống khác nhau

**Lỗi A — chạm ô khi lưới còn đang "nảy vào" lúc mới bấm Play.** Lưới đầu tiên nảy vào theo nhạc
(`is-entrance`, mỗi ô một animation `fill-mode:both` + `animation-delay` riêng), kéo dài tới
`ENTRANCE_MUSIC_MS` = 2460ms. Chạm 1 ô TRONG lúc đó (rất dễ xảy ra) làm `animateOpen()` gỡ
`grid.classList.remove("is-entrance")` ngay lập tức — với animation `fill-mode:both`, ô nào chưa tới lượt
(còn giữ `opacity:0/scale:.72` nhờ giữ trạng thái "from") hay đang nảy dở, khi gỡ animation thì KHÔNG còn gì
giữ giá trị đó nữa → nhảy thẳng về mặc định `opacity:1/transform:none` tức thì, RỒI mới bắt đầu fade ra (vì
`is-exiting` chỉ chạy Ở CẤP LƯỚI từ Đợt 25, không cứu được từng ô). Đúng triệu chứng "xuất hiện khực một cái".

**Lỗi B — chạm ô kế tiếp nhanh trong lúc lưới đang fade-in trở lại sau khi đóng câu hỏi trước.** Đợt 24 cố ý
cho mở khoá chạm ô mới sớm, ở 80% animation đóng (để nhạy tay) — lúc đó lưới vẫn còn đang chạy
`is-appearing-fade` (đo thật: ở đúng mốc mở khoá 80%×1200=960ms, animation đó mới đi được ~70% quãng
đường tính từ lúc bắt đầu ở delay 400ms, tức lưới đang ở opacity ~0,7, CHƯA xong). `animateOpen()` cũ chỉ
thêm `is-exiting` mà KHÔNG gỡ `is-appearing-fade`, và keyframe `is-exiting` viết cứng `from{opacity:1}` —
khi 2 animation cùng nhắm `opacity` trên cùng phần tử, trình duyệt buộc lưới nhảy về đúng `opacity:1` (dù
thực tế đang ~0,7) trước khi mới fade xuống 0. Đúng triệu chứng "biến mất khực một cái" — cả lưới chớp sáng
lên rồi mới mờ đi.

### Sửa

**Lỗi A** — trong `animateOpen()`, TRƯỚC khi gỡ `is-entrance`: nếu lưới đang có class đó, đọc
`getComputedStyle` opacity + transform THỰC TẾ của từng ô rồi ghim làm inline style. Gỡ class lúc đó chỉ là
thao tác vô hình (giá trị đã bị ghim y hệt), và fade cấp lưới (opacity lưới 1→0) sau đó nhân với opacity ĐÃ
ghim của từng ô — ô nào ghim ở 0 thì cứ đứng yên vô hình suốt, không còn chớp lên nữa.

**Lỗi B** — đọc `getComputedStyle(grid).opacity` THỰC TẾ ngay trước khi đổi class, ghi vào biến CSS mới
`--otb-fade-from`; keyframe `aw-otb-box-fade-out` trong `open-the-box.css` đổi `from{opacity:1}` →
`from{opacity:var(--otb-fade-from,1)}`. Đồng thời gỡ hẳn `is-appearing-fade` + xoá `--otb-fade-delay` cũ
(tránh rò sang lần fade sau). Trường hợp KHÔNG bị ngắt quãng (đa số các lần chạm), `getComputedStyle` đọc lại
đúng `1` — hành vi y hệt trước, không đổi gì.

### Tự test (devserver `aword` :5510, đo DOM/computed style — pane preview không chạy animation thật,
### `visibilityState:"hidden"` đóng băng animation hoàn toàn, đúng bẫy đã ghi từ Đợt 25, nên đây là kịch bản
### XẤU NHẤT có thể xảy ra: mọi animation kẹt nguyên ở giá trị "from" cho tới khi bị ngắt)

- **Lỗi A**: chạm ô 0 ngay khi `is-entrance` vẫn đang active (9 ô, mọi ô đang kẹt ở `opacity:0`,
  `transform:matrix(0.72,...)` vì animation đứng yên trong pane) → sau khi chạm: `grid` đổi đúng
  `"aw-otb-grid is-exiting"`, và **cả 9 ô đều có inline `opacity:"0"` + `transform:matrix(0.72,...)`** — đúng
  y hệt giá trị TRƯỚC khi gỡ class, xác nhận đã ghim đúng, không có bước nào nhảy về 1.
- **Lỗi B**: chơi thật 1 vòng (mở ô 0 → chờ hết gate → bấm 1 đáp án SAI → 1400ms sau `closeCardThen` dựng
  lưới mới `is-appearing-fade`, kẹt ở `opacity:"0"`) → chạm ô kế NGAY lúc đó: `grid` đổi đúng
  `"aw-otb-grid is-exiting"`, **`--otb-fade-from` đọc lại đúng `"0"`** (giá trị thật lúc ngắt, không phải 1
  cứng), `--otb-fade-delay` cũ đã bị xoá sạch (chuỗi rỗng).
- **Hồi quy đường KHÔNG ngắt quãng**: chờ trọn 3s cho lưới nảy vào xong xuôi rồi mới chạm ô 0 →
  `--otb-fade-from` đọc lại đúng **`"1"`** — y hệt hành vi cũ, 0 lỗi console.
- Mount lại Quiz sau Open the box (bẫy rò CSS Đợt 22): 0 lỗi console.
- **Việc kế: thầy chơi thử trên máy thật** (tốt nhất bấm ô ngay lúc lưới còn đang nảy vào, và bấm ô kế thật
  nhanh ngay sau khi vừa trả lời xong) → xác nhận 2 ca trên hết chớp/khực → duyệt → commit + push + live.

## Đợt 25 (7/8/2026, v0.9.57) — MƯỢT HOÁ ZOOM MỞ + SLOGAN Ở THANH DƯỚI — ✅ THẦY DUYỆT → COMMIT `b6e7a12` + PUSH + LIVE (Pages tự build, `curl` xác nhận sau 23 giây)

> Chỉ sửa 2 file template: `open-the-box.js` + `open-the-box.css`. **KHÔNG đụng core.** Thầy gửi 2 yêu cầu
> 1 lượt: (1) "khi zoom từ ô số ra ô câu hỏi lớn, vài frame cuối hơi khựng và giật, muốn mượt từ đầu tới
> cuối"; (2) thêm slogan **OPEN THE BOX IN ANDREW CLASSES** vào đúng vị trí nút Next/Back cũ.

### YC1 — ⭐ LỖI THẬT: animation mở bị CẮT NGANG ở 840ms (70% quãng đường), không phải "máy yếu"

Tưởng là chuyện tối ưu hiệu năng, hoá ra là **một lỗi lập trình có thật** — và là lỗi đã từng được phát hiện
+ sửa cho chiều ĐÓNG ở Đợt 14 nhưng **bỏ sót chiều MỞ**, nên đúng như thầy tả: chỉ chiều mở mới giật.

`zoomElFrom()` (chiều MỞ) chạy **3 transition cùng lúc** trên ô câu hỏi: `transform` 1200ms, `opacity`
**840ms**, `border-radius` 1200ms. Dòng dọn dẹp lại viết là:

```js
el2.addEventListener("transitionend", clear, { once: true });   // ❌
```

`{once:true}` = nghe ĐÚNG MỘT sự kiện đầu tiên bất kể của thuộc tính nào — mà cái kết thúc SỚM NHẤT là
`opacity` ở **840ms**. `clear()` khi đó xoá luôn `style.transition` + `style.transform` inline, và xoá
transition đang chạy = **huỷ transform giữa chừng** → ô nhảy phắt tới trạng thái cuối ngay tại mốc 70%.
Với easing `cubic-bezier(.22,.9,.3,1)`, tại t=70% ô đã đi được **98,9%** quãng đường, nên cú nhảy chỉ ~1%
— **không nhìn ra là "nhảy"**, mà nhìn ra là **chuyển động bị chặt cụt**: cả đoạn giảm tốc cuối (khoảng 30%
thời lượng, phần mắt người nhạy nhất) không bao giờ được chạy. Đúng triệu chứng "vài frame cuối khựng, giật".

`zoomElTo()` (chiều ĐÓNG) đã có sẵn ghi chú dài giải thích chính xác cái bẫy này và lọc
`if (e.propertyName === "transform")` từ Đợt 14 — chiều mở chỉ đơn giản là chưa ai sửa. Nay sửa y hệt:

```js
el2.addEventListener("transitionend", (e) => { if (e.propertyName === "transform") clear(); });
```

`setTimeout(clear, ZOOM_FALLBACK_MS)` vẫn giữ làm phương án dự phòng (tab ẩn không bắn transitionend — chính
là ca đo được ở pane preview, xem phần tự test).

### YC1 (tiếp) — 3 việc dọn thêm để "mượt từ đầu tới cuối" chứ không chỉ hết giật ở cuối

Sau khi sửa lỗi trên, rà tiếp mọi thứ ĐANG CHẠY trong 1,2 giây đó (đo bằng `document.getAnimations()` —
**20 animation cùng lúc** ở bản cũ) và bỏ những thứ bắt CPU làm việc mỗi khung hình:

**(a) `border-radius` chỉ chạy nửa RẺ của quãng bay.** Bo góc dần (point 2 Đợt 21) là thứ DUY NHẤT trong
cú zoom mà card đồ hoạ không gánh hộ được: đổi bán kính = **vẽ lại toàn bộ ô mỗi khung hình**, và ô càng
TO thì vẽ lại càng đắt — tức đắt nhất đúng lúc cuối cú mở. Nay thêm hằng `ZOOM_RADIUS_MS = 45% ×
ZOOM_TRANSFORM_MS` (540ms): chiều MỞ cho bo góc chạy **540ms đầu** (lúc ô còn bé, vẽ lại rẻ); chiều ĐÓNG cho
nó chạy **540ms cuối** (delay 660ms — lúc ô đã co nhỏ), vẫn kết thúc đúng mốc 1200ms nên vẫn **đáp xuống
đúng bằng độ bo của ô số** như thầy duyệt ở Đợt 21. 55% còn lại của mỗi chiều nay là transform+opacity
thuần — thứ chạy thẳng trên card đồ hoạ.

**(b) Thanh đồng hồ đổi từ `width` sang `transform: scaleX()`.** Đo ra thanh giờ đang chạy một transition
`width 15000ms` — mà `width` thì trình duyệt phải **tính lại bố cục + vẽ lại mỗi khung hình, suốt cả ván**,
kể cả đúng lúc đang zoom. Nay `runCountdown`/`resetSharedTimer` chạy `scaleX(1)→scaleX(0)`, CSS thêm
`transform-origin: left center` nên **nhìn y hệt** (vơi dần về bên phải), nhưng main thread không phải làm
gì. Chỗ "ghim vị trí đang vơi" khi nạp đầy lại đọc từ ma trận transform (`DOMMatrixReadOnly(...).a`) thay
cho `getComputedStyle().width` — đã test đúng: bấm đáp án đúng → `scaleX(1)` + `transform 500ms`, đồng hồ
về 0:15, không lỗi.

**(c) Lưới ô số mờ đi bằng 1 animation trên CẢ LƯỚI thay vì mỗi ô một animation.** `.is-exiting` /
`.is-appearing-fade` trước đây nhắm `.aw-otb-box` → bài 120 ô = **120 animation opacity**, mà mỗi phần tử
đang animate đều được trình duyệt tách ra một lớp đồ hoạ riêng. Nay chuyển 2 luật đó lên `.aw-otb-grid`:
1 animation, 1 lớp, hình ảnh y hệt (các ô không chồng nhau nên mờ theo nhóm = mờ từng ô). Ô vừa bấm vẫn
`opacity:0` inline riêng. Hết luôn xung đột với animation vào-sân (nó ở trên Ô, cái này ở trên LƯỚI).
Đo thật với bài **120 ô**: tổng animation lúc mở từ ~132 xuống **13**.

**(d) Dời việc dọn DOM ra khỏi mấy khung hình cuối.** `pendingSettle` (xoá card lưới + trả 2 card khỏi
`position:absolute`) trước hẹn cứng ở `ZOOM_FALLBACK_MS` = 1280ms — mà ô đáp án CUỐI còn trượt tới
`1200 + stagger` (1425ms nếu 6 đáp án). Tức là một cú **tính lại bố cục cả sân (tới 120 ô)** rơi đúng vào
mấy khung hình cuối của animation. Nay hẹn ở `ZOOM_FALLBACK_MS + (số đáp án − 1) × TILE_STAGGER_MS`, tức
sau khi MỌI thứ đã dừng; không mất gì về hình ảnh vì lưới đã mờ hết (fill-mode `forwards`) từ mốc 1200ms.

### YC2 — Slogan ở đúng chỗ nút Next/Back cũ

Đi bằng đường có sẵn của engine: `ui.setNav({ ..., label: SLOGAN })` trong `updateProgress()` (giống
Running word / Running team; `label` là tham số core đã hỗ trợ từ 4/8). CSS đổi luật Đợt 24 từ **ẩn cả
`.aw-nav`** sang **chỉ ẩn `.aw-navbtn`** (2 nút mũi tên) rồi tạo kiểu cho `.aw-nav-label`: chữ nhỏ, mảnh,
giãn chữ, IN HOA, xám — cùng phong cách slogan của Crossword và Speaking cards.

⚠️ **Chiều cao bottombar KHÔNG đổi** (đây chính là chỗ Đợt 24 từng cắn): thứ cao 5cqw là `.aw-navbtn` và nó
vẫn bị ẩn; chữ slogan chỉ cao ~20px, thấp hơn nhiều cụm `.aw-iconbtn` 4cqw vốn quyết định chiều cao thanh.
Đo lại: bottombar **38.6px** ở CẢ màn lưới lẫn màn câu hỏi, playArea **431.3px** — trùng khít số đo Đợt 24.
2 luật CSS vẫn **scope** `:has(> .aw-otb-card, > .aw-otb-qcard)`, kể cả luật `.aw-nav-label` (label là của
CORE — viết trần là restyle "x of N" của mọi game khác suốt phiên, đúng bẫy Đợt 22).

### Tự test (devserver `aword` :5510, trình duyệt thật, đo DOM)

⚠️ Pane preview có `visibilityState:"hidden"` → **animation không chạy chút nào** (đo `getAnimations()` ra
rỗng ngay sau khi transition đáng lẽ đang chạy, `transitionend` không bao giờ bắn — chỉ nhánh `setTimeout`
dự phòng chạy). Nên **độ mượt bằng mắt phải để thầy nghiệm thu trên máy thật**; ở đây kiểm bằng số:

- **Chuỗi transition inline đúng cả 2 chiều:** MỞ = `transform 1200ms cubic-bezier(.22,.9,.3,1), opacity
  840ms, border-radius 540ms ...` (không delay); ĐÓNG = `... border-radius 540ms cubic-bezier(.4,0,.2,1)
  660ms` (delay đúng 660 = 1200−540).
- **Số animation cùng lúc lúc mở:** 9 ô → 20 xuống **13**; 120 ô → **13** (trước là ~132). Fade của lưới
  nay nhắm `aw-otb-grid is-exiting`, không còn nhắm từng `.aw-otb-box`.
- **Slogan:** `.aw-nav-label` = "OPEN THE BOX IN ANDREW CLASSES", `.aw-nav` = `flex`, `.aw-navbtn` =
  `none`, chữ 300/14.5px/letter-spacing 4.64px/#9aa3af/uppercase, `.aw-tools` vẫn cột 3.
- **Bottombar 38.6px ở cả 2 màn** (ô không co) — xem YC2.
- **Chơi thật 1 vòng:** mở ô → gate mở khoá đáp án → bấm ĐÚNG (điểm 1, đồng hồ nạp đầy `scaleX(1)`,
  transition `transform 500ms`) → đóng về lưới, ô hiện tick; mở ô khác → bấm SAI → ô khoá đỏ. Card lưới
  được settle mới gỡ đúng lúc, sân còn đúng 1 card. **0 lỗi console** (3 dòng 404 duy nhất là do CHÍNH
  đoạn test hồi quy: `ensureTemplate` giải đường dẫn CSS theo trang `test.html` nằm trong thư mục con →
  `templates/open-the-box/templates/quiz/quiz.css`; không phải lỗi sản phẩm).
- **Hồi quy bẫy Đợt 22 (rò CSS sang game khác):** mount Quiz / Anagram / True-false sau khi CSS Open the
  box đã nạp → `.aw-nav` = `flex`, `.aw-navbtn` = `flex` cao **48.3px**, `.aw-nav-label` vẫn 700 /
  17.4px / letter-spacing `normal` / màu mặc định. **Không rò.**

### Đợt 25b (cùng ngày, thầy bảo "xử lý luôn") — SÂN CHƠI HẾT CO 3px LÚC MỞ Ô ĐẦU TIÊN

Báo cáo Đợt 25 có ghi nhận: lần mở ô ĐẦU TIÊN mỗi ván, **topbar** cao thêm 3px (34 → 37) → playArea
431.3 → **428.3px**, tức lưới/ô co lại một lần. Thầy yêu cầu xử lý luôn. Đây là cùng một loại lỗi với
Đợt 24, chỉ khác đầu khung: một hàng của khung **được dựng muộn** nên khung phải chia lại chiều cao
giữa lúc chơi. Hoá ra có **HAI** nguồn dựng-muộn chứ không phải một:

**(1) `ensureTimerUI()` chạy lúc mở ô đầu tiên.** Hàng đồng hồ + thanh giờ chỉ được chèn vào
`ui.topbarMid` khi `startSharedTimerIfNeeded()` chạy — tức ngay lúc thầy chạm ô đầu tiên. **Sửa:** gọi
`ensureTimerUI()` **một lần lúc mount**, ngay trước `render()`. Đồng hồ đứng yên ở đúng thời gian mỗi câu
(0:15) với thanh đầy, cho tới khi ô đầu tiên khởi động đếm ngược — `startSharedTimerIfNeeded()` vẫn giữ
cờ `timerStarted` nên **luật đồng hồ không đổi một li nào**, chỉ có phần HÌNH được vẽ sẵn.

**(2) ⭐ Bẫy ngoài dự đoán — chiều cao hàng đồng hồ phụ thuộc vào LÚC FONT TẢI XONG.** Sửa (1) xong đo lại
vẫn thấy nhảy: topbar **31px** lúc vừa mount rồi **37px** vài trăm ms sau. Nguyên nhân: `.aw-otb-q-clock`
không khai `line-height`, nên chiều cao dòng lấy theo **metrics của chính font** — font dự phòng cho 31px,
Baloo 2 tải xong cho 37px. Tức là trước đây cú nhảy 3px thầy thấy KHÔNG chỉ do dựng muộn, mà một phần do
font: dựng hàng lúc nào thì nó lấy metrics của font đang có lúc đó. **Sửa:** khai thẳng `line-height: 1.6`
cho ô đồng hồ — chiều cao nay tính từ **cỡ chữ** (đơn vị cqw, luôn xác định), không từ metrics font. Số
1.6 tái tạo đúng chiều cao Baloo 2 đang cho (37px ở sân rộng 968px) nên **nhìn không đổi gì**.

**Đo lại (cùng 1 lần chạy, 3 mốc):** lúc mount (`document.fonts.status = "loading"`) topbar **37.1px** /
playArea **428.2px** → mở 1 ô: **37.1 / 428.2** → sau `await document.fonts.ready` (`"loaded"`): **37.1 /
428.2**. **Chênh lệch = 0 ở mọi mốc.** Cộng với bottombar 38.6px cố định (YC2 ở trên), nay **cả 3 hàng của
khung đứng yên tuyệt đối suốt ván — không có gì co lại lúc nào nữa.** Lưới bắt đầu ván ở kích thước cuối
cùng của nó (ô 125.8px ở sân này) thay vì to hơn 3px rồi tụt xuống.

**Chơi lại đủ đường sau khi sửa:** mở ô → đếm ngược khởi động đúng lúc chạm ô đầu (`transform 15s linear`
→ `scaleX(0)`) → trả lời ĐÚNG (điểm 1, thanh nạp đầy `scaleX(1)` + `transform 500ms`, đồng hồ về 0:15) ·
đường HẾT GIỜ → `gameOver` (panel **GAME OVER** của engine, 9 ô nổ đúng) · topbar vẫn 37.1px ở mọi mốc ·
**0 lỗi console, 0 tài nguyên lỗi** (40 request đều 200).

### Ghi nhận thêm (KHÔNG sửa đợt này)

- `setupFit()` chạy ~29ms ngay trước cú zoom (đo với bài 120 ô, 4 đáp án): 5 ô × tìm kiếm nhị phân 16 vòng,
  mỗi vòng ép trình duyệt đo lại. Nó nằm TRƯỚC animation nên không gây giật giữa chừng, cùng lắm làm cú
  mở khởi động trễ ~2 khung hình. Nếu thầy còn thấy "mở hơi trễ tay" thì đây là chỗ tối ưu tiếp theo.
- Bài học chung, đáng chép vào luật template: **đừng để chiều cao một hàng của khung phụ thuộc metrics
  font** (luôn khai `line-height` rõ ràng cho chữ nằm trong topbar/bottombar), và **đừng dựng muộn** một
  hàng cố định của khung — cả hai đều biểu hiện y hệt nhau: "ô tự dưng co lại giữa chừng".

## (Lịch sử) TRẠNG THÁI trước: ✅ ĐÃ CHỐT + LIVE — 7/8/2026 (Đợt 24, v0.9.56) — BỎ HẲN NAV NEXT/BACK (Ô HẾT CO) + KHOÁ CHỌN Ô SỐ TỚI 80% ANIMATION ĐÓNG (thầy duyệt → commit `f75a25e` + push + live)

## Đợt 24 (7/8/2026, v0.9.56) — BỎ NAV Ở CẢ MÀN CÂU HỎI + GATE 80% KHI ĐÓNG — ✅ THẦY DUYỆT → COMMIT `f75a25e` + PUSH + LIVE

> Chỉ sửa 2 file template: `open-the-box.css` (2 selector ẩn nav) + `open-the-box.js` (`boxUnlockTimer` trong
> `closeCardThen`). **KHÔNG đụng core.** Thầy gửi 2 yêu cầu 1 lượt.

**YC1 — Bỏ hẳn nav Next/Back/"x of N", ô câu hỏi/đáp án hết bị co.**
Open the box là game "bấm ô bất kỳ", nav tuyến tính vô nghĩa → phải ẩn. Luật ẩn nav CŨ (Đợt 22) chỉ scope
`.aw-playarea:has(> .aw-otb-card)` = màn **LƯỚI SỐ**. Nhưng khi mở 1 ô, `animateOpen` gỡ card lưới, chỉ còn
`.aw-otb-qcard` (màn câu hỏi) là con trực tiếp `.aw-playarea` → selector **thôi khớp** → **nav hiện lại ở MỌI
màn câu hỏi**. Đây chính là chỗ "co lại": `.aw-navbtn` cao **5cqw** trong khi `.aw-iconbtn` (menu, loa,
phóng-to) chỉ **4cqw** (xem `core/app.css`), nên nav xuất hiện làm bottombar cao thêm ~1cqw, **cướp đúng
ngần đó chiều cao của playArea** → ô câu hỏi + ô đáp án co nhỏ đúng lúc zoom mở vừa xong (lúc `gridCard.remove()`
chạy). **Sửa:** nới selector khớp CẢ hai card:
```css
.aw-playarea:has(> .aw-otb-card, > .aw-otb-qcard) ~ .aw-bottombar .aw-nav { display: none; }
.aw-playarea:has(> .aw-otb-card, > .aw-otb-qcard) ~ .aw-bottombar > .aw-tools { grid-column: 3; }
```
→ nav ẩn suốt cả game (lưới lẫn câu hỏi lẫn 2 lúc chuyển cảnh đều có ít nhất 1 trong 2 card), bottombar giữ
nguyên **4cqw**, ô không bao giờ co. **Vẫn tự-dọn** như Đợt 22 (keys theo markup RIÊNG của template — biến mất
ngay khi game khác mount): KHÔNG dính lại bẫy "CSS ở lại document mãi mãi" vì luật vẫn có scope, chỉ nới thêm
card nào được coi là "đang có sân Open the box".

**YC2 — Sau khi chọn đáp án + câu hỏi đóng lại, khoá chọn ô số tới 80% animation đóng.**
Đối xứng với gate mở đáp án 80% ở **point 4 (Đợt 21)** lúc MỞ. Trước đây ô số chỉ bấm được khi zoom đóng xong
**100%** (2 lớp chặn: grid `pointer-events:none` + qcard `z-index:2` `.aw-otb-anim-top` che lên trên chặn tap).
Thêm biến `boxUnlockTimer` + hàm mở khoá trong `closeCardThen`:
```js
boxUnlockTimer = setTimeout(() => {
  boxUnlockTimer = null;
  if (myToken !== animToken) return;   // close cũ bị close/open mới vượt → bỏ
  grid.style.pointerEvents = "";       // grid về live
  qcard.style.pointerEvents = "none";  // qcard (vẫn đang co) thành trong suốt → tap XUYÊN QUA
}, Math.round(ZOOM_TRANSFORM_MS * 0.8));   // 80% × 1200 = 960ms
```
Phải nhấc CẢ hai: chỉ mở grid thôi vẫn bị qcard che; phải cho qcard `pointer-events:none` để tap đi thẳng
xuống ô bên dưới, trong khi zoom-đóng vẫn chạy tiếp về 100% về mặt HÌNH ẢNH (chỉ mở INPUT sớm). `boxUnlockTimer`
gộp vào `clearPending()` (gọi ở đầu mọi open/close + trong cleanup) nên close/open mới hoặc rời template đều huỷ
timer treo. Ô đã giải/khoá hoặc khi `ended` vẫn disabled trong `buildBoxGrid` → gate này chỉ mở ô còn chơi được.

**Tự test devserver (`aword` :5510, trình duyệt thật, đo DOM — pane không compositing: KHÔNG chụp ảnh được,
transition không chạy, timer bị throttle nên timeline GIÃN ra; nhưng pointer-events là inline set tức thì khi
timer bắn nên đo chính xác, và THỨ TỰ + TỈ LỆ giữ đúng):**
- **YC1:** màn LƯỚI: nav `display:none`, bottombar **38.6px**, playArea 431.3px. Mở 1 ô → màn CÂU HỎI (DOM chỉ
  còn `.aw-otb-qcard`, KHÔNG còn `.aw-otb-card`): nav VẪN `display:none`, bottombar **38.6px** = **y hệt** →
  ô **0 co**. (Với selector CŨ, ở màn này nav sẽ là `flex` và bottombar phình lên.)
- **YC2 (đường chọn đáp án bình thường, driver tự chạy trong trang):** t=1114 clickAnswer → t≈2113 CLOSE bắt đầu
  `gridPE=none` + qcard che `qcardPE=auto` = **CHẶN** → t≈3016 (~903ms vào close ≈ **80%** của 1200ms)
  `gridPE=auto` + `qcardPE=none`, qcard **vẫn present** = **MỞ KHOÁ**; tap ô kế NGAY lúc đó (`qcardPresentAtTap:
  true, qcardPEatTap:"none"`) → **ô kế MỞ THẬT** (open transition mới t≈3114). Khoảng mở-khoá→gỡ qcard ≈ 240ms
  = đúng tỉ lệ 960/1200. Cũng đo lại đường **timeout 15s → gameOver** (cùng `closeCardThen`): chuỗi chặn→mở-80%→
  gỡ giống hệt, ô vẫn disabled đúng khi `ended`.
- **0 lỗi console.** Bẫy gặp lại: (a) pane `visibilityState:"hidden"` → throttle timer, phải chờ thời gian thực
  dài + đo bằng recorder trong trang (round-trip ngoài quá chậm, đua với timeout 15s). (b) trong trình duyệt
  `clearInterval`/`clearTimeout` HOÁN ĐỔI id được — vòng lặp `for(i)clearInterval(i)` để dọn recorder đã giết
  luôn timer của game, làm nhiễu 1 lần đo → phải giữ id recorder riêng, đừng quét sạch.

**Việc kế:** thầy chơi thử trên màn cảm ứng thật (TOMKO): xác nhận (1) ô câu hỏi/đáp án KHÔNG còn co khi mở, và
(2) sau khi trả lời, nhịp cho chọn ô kế ở ~80% lúc đóng thấy nhạy/tự nhiên (không hụt, không lỡ tay bấm sớm) →
duyệt → commit + push + live.

## (Lịch sử) TRẠNG THÁI trước: ✅ ĐÃ CHỐT + LIVE — 4/8/2026 (đợt 22, v0.9.36) — SỬA 1 LỖI RÒ CSS RA TOÀN APP (thầy duyệt → commit `9dad80b` + push + live, đã kiểm chứng trên bản live)

## Đợt 23 (4/8/2026, v0.9.40) — BẢN VÁ "GÓC VUÔNG KHI CHẠM" ĐÃ LÊN CORE — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

> **KHÔNG sửa file nào của Open the box đợt này.** Ghi vào đây vì game này chính là nơi tìm ra thuốc.

Thầy báo Open the box đã hết hiện tượng "nền góc vuông khi chạm", nhưng Quiz và nhiều game khác vẫn bị.
Điều tra ra: thuốc chữa nằm ở **Đợt 21 điểm 1** của chính file này — `-webkit-tap-highlight-color:
transparent` đặt trên `.aw-otb-box` + `.aw-otb-qtile` (xem dòng 90 và 378 `open-the-box.css`). Nhưng nó
chỉ chữa cho **2 loại ô của riêng game này**; 12 nút dùng chung của engine (Next/Back, ☰, loa, phóng to,
Options/Template/Style, Edit/Assignment/Print) **vẫn dính ngay cả khi đang chơi Open the box** — đo được
12 phần tử.

Nay đã nâng lên thành **1 luật gốc trong `core/app.css`**: `html { -webkit-tap-highlight-color:
transparent; }` (thuộc tính KẾ THỪA → phủ cả app, mọi template hiện tại lẫn về sau). Chi tiết + số đo
đầy đủ: `core/HUONG DAN CORE.md` mục "MÀN CẢM ỨNG (TOMKO)".

2 luật cũ trong `open-the-box.css` **giữ nguyên** — nay là thừa nhưng vô hại, và phần chú thích của
chúng là dấu vết lịch sử có ích. Đừng chép khuôn này sang template mới nữa: đã có ở gốc.

## Đợt 22 (4/8/2026, v0.9.36) — ⭐ SỬA LỖI THẬT: CSS của game này ẨN NÚT BACK/NEXT CỦA MỌI GAME KHÁC

> Chỉ sửa `open-the-box.css` (2 luật đầu file). KHÔNG đụng `.js`, KHÔNG đụng core. Lỗi lộ ra khi làm
> Đợt 61 (thầy yêu cầu nút Back/Next to hơn "ở mọi template") — xem `GHI CHU DU AN.md` Đợt 61 mục (1b).

**Lỗi:** file này mở đầu bằng luật **TRẦN** `.aw-nav { display: none; }` (kèm `.aw-bottombar > .aw-tools
{ grid-column: 3 }`), với ghi chú tự trấn an *"chỉ CSS của template này được nạp khi Open the box đang
chơi nên không ảnh hưởng template khác"*. **Ghi chú đó đã SAI kể từ v0.9.7 (Đợt 33)**: `ensureTemplate()`
chèn stylesheet của template MỘT LẦN rồi để đó VĨNH VIỄN, không gỡ khi rời game. Hệ quả: thầy mở Open the
box một lần là **mọi game mở sau đó trong cùng phiên đều mất nút Back/Next** (và mất luôn ô "x of N"),
tới khi tải lại trang. Whack-a-mole đã cảnh báo đúng cái bẫy này trong CSS của nó từ Đợt 57, nhưng file
này chưa được rà lại.

**Đo thật (trước khi sửa):** mount Open the box → mount Quiz → `getComputedStyle('.aw-nav').display`
= `"none"`. Sau khi sửa: Quiz trở lại `flex`, nút 83×48; quét 14 template thì 10 game có nav đều bình
thường, còn Find the match / True-false / Whack-a-mole vẫn ẩn 2 nút theo thiết kế riêng của chúng.

**Sửa:** scope cả 2 luật vào đúng lúc có sân Open the box đang sống (thẻ gốc `.aw-otb-card` là con TRỰC
TIẾP của `.aw-playarea`), theo đúng khuôn whack-a-mole:
```css
.aw-playarea:has(> .aw-otb-card) ~ .aw-bottombar .aw-nav { display: none; }
.aw-playarea:has(> .aw-otb-card) ~ .aw-bottombar > .aw-tools { grid-column: 3; }
```
Kiểm lại: Open the box vẫn tự ẩn nav như cũ và cụm loa/phóng-to vẫn nằm góc phải (cột 3).

**Bài học cho mọi template:** đừng bao giờ viết luật CSS TRẦN nhắm vào class của core (`.aw-nav`,
`.aw-bottombar`, `.aw-topbar`...) — CSS template ở lại document mãi mãi. Luật đã ghi vào
`core/HUONG DAN CORE.md`.

## Đợt 21 (4/8/2026) — 5 cải tiến UX theo yêu cầu thầy

> Chỉ sửa 2 file template: `open-the-box.js` + `open-the-box.css`. **KHÔNG đụng core.** Tự kiểm bằng
> `javascript_tool` trên trình duyệt thật (test.html + dữ liệu bịa ép ca biên). Điểm 2 là hiệu ứng thị
> giác — đã xác minh không lỗi + inline style set/clear đúng, nhưng **hình ảnh mượt cần thầy xem trên
> màn thật** (preview không cấp compositing để tự quay).

**1) Sửa lỗi NHÁY VUÔNG khi chạm ô (điểm 1).** Khi chạm ô số / ô đáp án trên màn cảm ứng, nháy 1-2 frame
một "nền vuông 4 góc" dù ô bo tròn. Nguyên nhân: `-webkit-tap-highlight-color` **mặc định của Chrome =
`rgba(0,0,0,0.18)`** (không set ở đâu cả), và Blink vẽ lớp phủ chạm này thành HÌNH CHỮ NHẬT theo border-box,
BỎ QUA border-radius. Sửa: đặt `-webkit-tap-highlight-color: transparent` (+ `-webkit-touch-callout:none`,
`user-select:none`) trên `.aw-otb-box` và `.aw-otb-qtile`. Xác minh: `webkitTapHighlightColor` = `rgba(0,0,0,0)`
trên cả hai. Phản hồi khi bấm vẫn có nhờ `:active` sẵn có.

**2) BO GÓC DẦN khi ô câu hỏi bay về ô số (điểm 2).** Trước đây `zoomElTo` chỉ scale transform → bán kính
bo tròn của tile bị scale nhỏ theo → đáp xuống trông gần VUÔNG so với ô số bo tròn. Sửa: animate luôn
`border-radius` trong `zoomElTo` (và `zoomElFrom` để 2 chiều đối xứng). Đích = `boxRadius/scaleX` ngang &
`boxRadius/scaleY` dọc (cú pháp elip `Rx / Ry`), để sau khi scale thì `scale*radius == boxRadius` → khớp
đúng độ bo của ô số. `readBoxRadius()` đọc px thật từ `.aw-otb-face-front` (theme-agnostic). Dọn inline
`borderRadius=""` khi xong. Nếu không có grid (nhánh renderQuestion dự phòng) → `br=0` → bỏ qua an toàn.
Xác minh: mở xong tile đã CLEAR inline radius, 0 lỗi.

**3) CHỮ BACK-FACE co theo cỡ ô khi NHIỀU ô (điểm 3).** Ô đã giải/khoá lật hiện câu hỏi (+đáp án) ở
`1.5cqw` CỐ ĐỊNH (stage-relative) → nhiều ô nhỏ thì chữ tràn, bị `overflow:hidden` cắt. Sửa: (a) `layoutGrid`
đặt `--back-size = size*0.12` px (theo cỡ ô THẬT, giống `--num-size`); (b) hàm MỚI `fitBackFaces(root)` co
`--back-fit` từng ô đang mở tới khi nội dung (đo CHIỀU CAO FLOW `q+gap+a` so với face trừ padding trừ chỗ
chừa cho huy hiệu tick/khoá, + tràn NGANG của từng dòng) vừa trọn; gọi ở `renderGrid`, `closeCardThen`,
ResizeObserver. Xác minh: 20 ô (cell 121px), câu dài "What do you call a person who studies the weather
patterns?" + "✓ Meteorologist" → back-fit 0.827, contentH 76 ≤ 78, 0 tràn ngang, HIỆN TRỌN.

**4) KHÓA BẤM ĐÁP ÁN tới 80% animation (điểm 4).** Trước đây đáp án gắn onclick ngay khi build, bấm được
lúc còn đang trượt vào (1.2s) → dễ bấm nhầm trước khi đọc. Sửa: biến `answersUnlocked` + `gateTimer`; khi
build đặt `.aw-otb-q-answers.is-gated { pointer-events:none }` và hẹn giờ mở sau **80% × (ZOOM_TRANSFORM_MS
+ stagger ô cuối)**; `answer()` chốt chặn thêm `!answersUnlocked`. Xác minh: bấm ở 300ms KHÔNG ăn (vẫn ở màn
câu hỏi), sau ~1.1s `is-gated` gỡ + `pointer-events:auto` → bấm được.

**5) KHÔNG NGẮT TỪ trong ô đáp án + ô câu hỏi (điểm 5).** `overflow-wrap:normal` vốn không ngắt từ, nhưng
từ >40 ký tự chạm sàn fit `FIT_MIN 0.4` rồi TRÀN; và `.aw-otb-q-qtext` chỉ kế thừa overflow-wrap. Sửa:
(a) khai rõ `overflow-wrap:normal; word-break:keep-all` trên `.aw-otb-q-qtext`, `.aw-otb-q-text` (và back-q/
back-a); (b) `fitOne` thêm bước co DƯỚI SÀN theo tỉ lệ `clientWidth/scrollWidth` (tới HARD_MIN 0.12) để từ
cực dài vẫn nằm TRỌN 1 dòng. Xác minh: "Pneumonoultramicroscopicsilicovolcanoconiosis" (45 ký tự) →
fit 0.372, KHÔNG tràn, 1 dòng; từ ngắn vẫn 1.5.

**File đổi đợt này**: `open-the-box.js` (fitOne co dưới sàn; `--back-size` trong layoutGrid; hàm `fitBackFaces`
+ 3 chỗ gọi; gate `answersUnlocked/gateTimer` trong buildQuestion/answer/cleanup; border-radius trong
zoomElTo/zoomElFrom + helper `readBoxRadius`), `open-the-box.css` (tap-highlight trên box+qtile; overflow-wrap
rõ ràng + keep-all; `.is-gated`; back-face dùng `--back-size`/`--back-fit`).
**Việc kế: thầy chơi thử trên màn cảm ứng thật (nhất là điểm 1 nháy vuông + điểm 2 bo góc) → duyệt →
commit + push (gộp cùng Đợt 51–54 đang chờ).**

## (Lịch sử) TRẠNG THÁI trước: ✅ ĐÃ CHỐT + LIVE — 1/8/2026 (đợt 19)

> **CẬP NHẬT 1/8/2026:** TẤT CẢ các đợt **11 → 19** (mọi dòng "CHƯA COMMIT" bên dưới nay ĐÃ CŨ) đã được
> thầy **DUYỆT** và **commit + push + live** — commit **`da11950`** (nhật ký dự án `5dc2283`). Xem
> `GHI CHU DU AN.md` "Đợt 28". Nhánh `main` đang sạch/đồng bộ. Phiên sau **tiếp tục build được ngay**.
> ⚠️ Working tree còn thay đổi CHƯA COMMIT của **phiên khác (template Type the answer)**: `core/sound.js`,
> `core/engine.js` (hunk `hideShuffleAnswers`), cả thư mục `templates/type-the-answer/` — **ĐỪNG commit
> nhầm** phần đó; nó thuộc việc dở của phiên kia.

## Đợt 20 (3/8/2026) — Thêm option TRỪ ĐIỂM khi trả lời SAI
Thêm `pointsOff` (0..5, mặc định 0) đọc 1 lần trong `mountQuestions`. Mỗi lần chọn đáp án SAI trong
`answer()` trừ `score -= pointsOff` (KHÔNG chặn về 0 — cho phép âm), `updateProgress()` sẵn có tự làm mới
cả điểm góc phải lẫn bộ đếm nav. `finishRound` báo thêm `score` để màn kết thúc dùng đúng điểm này. Khi
`pointsOff===0` mọi thứ y hệt trước (score luôn = số câu đúng). Đã seed `pointsOff: 0` vào sample.

## (Lịch sử) TRẠNG THÁI ban đầu: ĐÃ GỘP TRANG CHỦ + PUSH GITHUB (30/7/2026)

Thầy yêu cầu thẳng "đưa lên live" (30/7/2026, không qua bước tự chơi thử ở local trước — thầy cần
dùng ngay trên máy khác) → gộp vào trang chủ luôn: `core/catalog.js` đổi `built:true`,
`index.html` thêm `<link>` CSS, `manifest.js` thêm entry, `main.js` thêm `import` đăng ký template +
sửa hàm xem trước thẻ act (`actCard`/`previewPick`) để đọc đúng `content.items` (trước đó hàm này chỉ
đọc `content.questions` kiểu Quiz nên thẻ Open the box/Type the answer/**cả Anagram** sẽ hiện "No
questions yet" — tiện sửa chung 1 lần cho cả 3). Đã kiểm: trang chủ tải 0 lỗi console, mọi module mới
(`open-the-box.js`, `open-the-box-editor.js`, `otb-sound.js`) tải 200 OK; test lại `test.html` riêng
không hồi quy; chạy thử hàm `previewPick` với dữ liệu mẫu thật cho cả 4 loại game ra đúng câu hỏi +
đáp án. **CHƯA tự bấm được** luồng đăng nhập Google + "+ New activity" + kéo-thả thẻ thật trên trang
chủ (Google chặn tự động hoá đăng nhập) — thầy tự xem khi vào bản live. Đã **commit + push GitHub**.

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/04-OPEN-THE-BOX.md` (2 chế độ Simple/Questions, options cols/rows, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `open-the-box.js` — module game, `type: "open_the_box"`, **`scorable: false`** (game MỞ — KHÔNG chấm điểm, không leaderboard; xem lưu ý dưới).
   - `open-the-box.css` — giao diện riêng, mọi class prefix `.aw-otb-`.
   - `sample-open-the-box.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/open-the-box/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Lưới hộp đánh số (đóng). Chạm hộp → mở, hiện nội dung (prompt hoặc câu hỏi). Dùng cho hoạt động lớp (bốc câu nói, ôn ngẫu nhiên). Option: hộp để mở / tự đóng, số cột/hàng.

## ⚠️ Lưu ý riêng: game open-ended đầu tiên
Engine hiện tại LUÔN chạy vòng finish → celebration → leaderboard (thiết kế cho game scorable). Template này KHÔNG có điểm — khi build cần kiểm tra engine đối xử `scorable:false` thế nào; nếu engine cần thêm nhánh open-ended (bỏ celebration/leaderboard, nút kết thúc riêng), **KHÔNG tự sửa core/** — ghi đề xuất chi tiết vào mục dưới để session tổng xử lý.

## Nhật ký

### 1/8/2026 (đợt 19) — Chữ in-game: chuyển từ 1 cỡ CHUNG sang cỡ ĐỘC LẬP TỪNG Ô (từ dài chỉ nhỏ riêng ô đó, có lề, không chạm mép)

Thầy chơi bản đợt 18: chữ đã ổn nhưng **1 từ quá dài ("Meteorologist") chạm sát mép ô**. Yêu cầu: "giảm
size linh hoạt" cho riêng trường hợp đó. Nguyên nhân: đợt 18 dùng **1 `--fit` CHUNG** cho cả màn (chọn
cỡ lớn nhất mà MỌI ô vừa) → từ dài nhất quyết định, và nó vừa-khít-tràn-mép chứ không có lề.

**Sửa — cỡ chữ ĐỘC LẬP TỪNG Ô** (đúng kiểu Wordwall thật):
- Mỗi ô đáp án + ô câu hỏi tự co/giãn chữ CỦA RIÊNG NÓ trong [FIT_MIN 0.4, FIT_MAX 1.5] → từ ngắn to
  1.5×, từ dài chỉ nhỏ riêng ô đó (vd Meteorologist 1.35, các ô khác vẫn 1.5).
- Chữ câu hỏi bọc trong span riêng `.aw-otb-q-qtext` (trước nằm trực tiếp trong tile) để co độc lập; cả
  span câu hỏi lẫn `.aw-otb-q-text` thêm **`width:100%`** để chữ NHIỀU TỪ **wrap theo khoảng trắng**
  (nhiều dòng) thay vì nằm 1 hàng dài rồi thu nhỏ.
- Viết **hàm fit riêng** (không dùng `fitOnce` cho in-game): đo CAO so với ô, đo NGANG bằng **tự-tràn của
  chính span** (`scrollWidth > clientWidth` của span) — vì span full-width nên chỉ có 1 từ đơn quá rộng
  mới thò ra; cách này TRÁNH lỗi "luôn báo tràn" nếu so span full-width với bề rộng ô. (Đã thử dùng
  `fitOnce` contentBox nhưng chính vì span=100% nên nó luôn báo tràn → co về min; bỏ.) Từ dài dừng lại
  **vừa trong vùng chứa (trong padding ô)** nên có lề tự nhiên ~1.6cqw, hết chạm mép. Bỏ `import fitOnce`
  khỏi open-the-box.js (chỉ còn engine dùng cho Show answers).
- CSS phụ trợ đợt 18 vẫn giữ (`minmax(0,1fr)` + các `min-width:0`) để 1 từ unbreakable không kéo giãn ô.

**Test bằng `javascript_tool`** (browser thật, ép nội dung + dữ liệu thật):
- Ép Biologist / **Meteorologist** / "To make people feel more relaxed" / Yes vào 4 ô: fit lần lượt
  **1.50 / 1.35 / 1.44 / 1.50** (ĐỘC LẬP, `perTileFitsDiffer:true`); Meteorologist 1 hàng KHÔNG bể,
  "To make..." **wrap 3 dòng**, câu hỏi dài **wrap 4 dòng** ở 1.5 — mọi ô fitsHeight, 0 tự-tràn.
- Dữ liệu thật (câu "Which word means very tired?" + Excited/Curious/Anxious/Exhausted): câu hỏi wrap 3
  dòng 1.5, 4 đáp án 1.5, 0 tràn.
- 0 lỗi console. (Show answers của đợt 18 không đụng — vẫn dùng fitOnce contentBox.)

**File đổi đợt này**: `open-the-box.js` (bỏ import fitOnce; `setupFit` viết lại thành fit riêng TỪNG Ô;
`buildQuestion` bọc span `.aw-otb-q-qtext`; comment FIT_MAX/MIN cập nhật), `open-the-box.css` (tách
font-size câu hỏi sang `.aw-otb-q-qtext` + `width:100%`; `.aw-otb-q-text` thêm `width:100%`).

**CHƯA COMMIT** — chờ thầy chơi thử. Cùng lô với đợt 11–18.

### 1/8/2026 (đợt 18) — SỬA 2 LỖI PHÁT SINH TỪ ĐỢT 17: chữ in-game quá to + bẻ giữa từ; Show answers khuyết chữ

Thầy chơi bản đợt 17, gửi ảnh: (A) trong game chữ **quá to gây mất cân đối** và **xuống dòng GIỮA từ**
("Meteor/ologist", "Biologi/st"...); (B) màn **Show answers khuyết chữ** ("Meteorologis", "Enormou",
"Astronome" — cụt ký tự cuối). Cả 2 đều do đợt 17 gây ra. Đã **đo thật bằng `javascript_tool`** để tìm
đúng nguyên nhân gốc trước khi sửa.

**Nguyên nhân A (in-game):** `FIT_MAX=2.4` phóng chữ quá lớn; autoFit lõi CHỈ đo chiều cao (giả định từ
dài tự wrap), nên chữ to tới mức 1 từ không đủ chỗ 1 hàng → `overflow-wrap:anywhere` bẻ ngang giữa từ,
autoFit tưởng "vừa" vì cao vẫn lọt.

**Nguyên nhân B (Show answers):** LỖI THẬT TRONG CORE `fitOnce` (co chữ 1 lần) — nó so `scrollWidth >
box.clientWidth`, mà `clientWidth` **gồm cả padding ~19px**; vùng chữ thật chỉ ~82px. Chữ 99px "qua"
được phép so 101px nên fitOnce dừng ở fit=1.0, rồi bị `.aw-rv-cell{overflow:hidden}` cắt cụt ~1-2 ký tự
cuối. Trước đây `overflow-wrap:anywhere` cho từ tự wrap nên né được lỗi tiềm ẩn này; đợt 17 đổi sang
`normal` làm nó lộ ra. (Đo tái hiện: 9 hàng có thanh cuộn → mọi từ dài đều `clips:true`.)

**Cách sửa:**
- **Core `fitOnce`** (`core/fit.js`): thêm tùy chọn **`contentBox`** (mặc định **TẮT** để KHÔNG đụng
  maze-chase & mọi caller khác) — khi bật thì trừ padding lúc đo (đo đúng vùng chứa thật). Bật
  `contentBox:true` ở **duy nhất** lời gọi màn Show answers trong `core/engine.js`, kèm hạ `min` 0.35→0.2
  để từ dài trong cột hẹp co đủ nằm trọn 1 hàng. → hết khuyết chữ cho Show answers của MỌI game.
- **In-game** (`open-the-box.js`): hạ **`FIT_MAX` 2.4 → 1.5** (chữ vẫn to hơn ~50% cỡ gốc, không còn
  "khổng lồ mất cân đối"); viết lại `setupFit` thành **WIDTH-AWARE** — chọn `--fit` lớn nhất trong
  [0.4, 1.5] mà VỪA CẢ chiều cao LẪN không có ô nào bị tràn ngang (đo tràn ở **cấp ô `.aw-otb-qtile`**,
  không phải ở span chữ — vì span là flex item tự nở theo min-content của từ nên giấu mất tràn). Bỏ
  `import autoFit`.
- **`open-the-box.css`**: `.aw-otb-q-text` `overflow-wrap:anywhere → normal` (không bẻ giữa từ);
  `.aw-otb-q-answers` `grid-template-columns: repeat(2, minmax(0,1fr))` + `min-width:0`; `.aw-otb-q-question`
  và `.aw-otb-qtile` thêm `min-width:0` — chặn 1 từ dài "unbreakable" kéo giãn ô phá vỡ lưới 2 cột (khi
  đó tràn mới hiện đúng ở cấp ô để width-aware fit bắt được và co lại).

**Test bằng `javascript_tool`** (browser thật, gộp thao tác 1 lệnh, dùng cả bản import `core/fit.js` đã
vá thật):
- In-game ca thực tế (Meteorologist/Astronomer/Geologist/Biologist): `--fit`=**1.5**, **mọi từ 1 hàng,
  0 bẻ ngang**, từ vừa khít ô (tile overflow 0-1px), question tile 0 tràn. (Con số card overflow 805px
  chỉ là đáp án đang TRƯỢT VÀO từ 85cqw lúc đo giữa animation — không phải lỗi.)
- In-game ca bệnh lý (từ 34 ký tự): width-aware fit tự co `--fit`→**0.667** (không kẹt ở 1.5), từ vẫn
  KHÔNG bẻ ngang — lưới an toàn hoạt động.
- Show answers (chạy **fitOnce THẬT đã vá** `{min:0.2, contentBox:true}` trên 9 hàng có thanh cuộn):
  **anyClipped=false, anyMidWordWrap=false**, "Meteorologist" trọn vẹn 1 hàng.
- Hồi quy: Open the box + Quiz tải **0 lỗi console**; `fitOnce` mặc định `contentBox:false` nên
  maze-chase và các caller khác byte-for-byte y nguyên.

**File đổi đợt này**: `core/fit.js` (tùy chọn `contentBox`), `core/engine.js` (bật `contentBox:true` +
`min:0.2` cho review), `open-the-box.js` (FIT_MAX 1.5 + FIT_MIN + `setupFit` width-aware + bỏ import
autoFit), `open-the-box.css` (`.aw-otb-q-text` overflow-wrap normal; `minmax(0,1fr)` + nhiều `min-width:0`).

**CHƯA COMMIT** — chờ thầy chơi thử xác nhận ưng. Cùng lô với đợt 11–17.

### 1/8/2026 (đợt 17) — 5 cải tiến: chữ to tối đa, 120 câu, xác nhận 2 nút bulk, khóa chọn text (core), Show answers không cắt ngang từ (core)

Thầy chốt 5 việc qua AskUserQuestion (đã hỏi phạm vi 2 mục đụng core + chờ "ok build" đúng quy trình):

1. **Chữ ô câu hỏi + đáp án PHÓNG TO tối đa khi còn chỗ** (chỉ Open the box). Trước đây `autoFit` chặn
   ở `max:1` — chữ KHÔNG BAO GIỜ to hơn cỡ gốc (câu hỏi 3cqw, đáp án 2.6cqw), chỉ biết co nhỏ. Nay
   thêm hằng `FIT_MAX = 2.4` truyền vào `setupFit` → chữ ngắn được phóng to tới ~2.4 lần khi vừa khung,
   chữ dài vẫn tự co < 1 như cũ. autoFit chỉ đo CHIỀU CAO nên chữ to làm text wrap tăng cao → tự giới
   hạn, không tràn; `overflow-wrap:anywhere` sẵn có trên `.aw-otb-q-text` lo phần bề ngang.
2. **Editor tối đa 120 câu** (chỉ Open the box). `MAX_ITEMS` 100 → **120**. Sửa luôn `docs/04-OPEN-THE-BOX.md`
   ("min 2 – max 120"). Các thông báo paste Excel tự đọc `MAX_ITEMS` nên không cần đụng.
3. **Pop-up xác nhận cho "Mark correct in all" + "Unmark all correct"** (chỉ Open the box). "Delete all
   boxes" đã có `confirm()` từ trước; nay thêm `confirm()` cho 2 nút còn lại (cùng kiểu native confirm mà
   MỌI editor khác đang dùng — nhất quán). Bấm Cancel → không đổi gì.
4. **Khóa chọn text trong khung chơi — CORE, áp cho MỌI game** (thầy chọn "tất cả game" qua
   AskUserQuestion). `core/app.css`: `.aw-stage { user-select:none }` + rule chừa
   `.aw-stage input/textarea/[contenteditable=true] { user-select:text }` để ô gõ chữ của **Type the
   answer** vẫn gõ/chọn được. Mục đích: chặn bôi xanh / tay cầm chọn text vô ý khi chơi trên bảng TOMKO.
5. **Show answers KHÔNG cắt ngang giữa từ — CORE, áp cho MỌI game** (thầy chọn "đồng ý sửa chung").
   `core/app.css` `.aw-rv-txt`: `overflow-wrap:anywhere` → **`normal`** (+ `word-break:normal`) → từ đơn
   luôn nằm trọn 1 hàng, chỉ xuống dòng ở khoảng trắng. `.aw-rv-cell` có sẵn `overflow:hidden` nên 1 từ
   cực dài (hiếm) bị cắt gọn thay vì tràn; đáp án dùng `fitOnce` (đo cả rộng lẫn cao) nên tự co vừa,
   không mất chữ — chỉ câu hỏi (cỡ cố định) mới có thể cắt từ siêu dài, chấp nhận được.

**Test bằng `javascript_tool`** (browser thật, `test.html`, gộp thao tác vào 1 lệnh để tránh đồng hồ 15s
hết giữa chừng):
- Mục 1: mở hộp câu ngắn → `--fit` = **1.71–2.35** (chữ to gấp ~1.7–2.4 lần: câu hỏi 5.13cqw, đáp án
  4.44cqw so với trần cũ 3/2.6cqw); đo `scrollWidth/scrollHeight` xác nhận **không tràn** bề ngang lẫn
  chiều cao, card vừa khít khung.
- Mục 2: màn Edit hiện đúng **"9 / 120 boxes"**.
- Mục 3: chặn `window.confirm` ghi log → đúng **3 lần gọi** (Mark×1, Unmark×2), nội dung đúng; Cancel →
  dấu đúng của 9 hộp **y nguyên**; OK (Unmark) → xóa sạch dấu đúng.
- Mục 4: `getComputedStyle('.aw-stage').userSelect === 'none'`; ô input của Type the answer trong khung =
  `'text'` (vẫn gõ/chọn được).
- Mục 5: dựng thử `.aw-review > .aw-rv-txt`, đo `overflowWrap === 'normal'`, `wordBreak === 'normal'`.
- Hồi quy: Quiz + Type the answer tải **0 lỗi console**; core mới áp đúng cho cả 2 (userSelect none,
  rvOverflowWrap normal) — đúng ý "áp chung mọi game" thầy đã duyệt.

**File đổi đợt này**: `open-the-box.js` (hằng `FIT_MAX` + truyền `max` vào `setupFit`),
`open-the-box-editor.js` (`MAX_ITEMS` 120 + `confirm()` cho Mark/Unmark), `core/app.css` (`.aw-stage`
user-select + rule chừa input; `.aw-rv-txt` overflow-wrap normal), `docs/04-OPEN-THE-BOX.md` (max 120).

**CHƯA COMMIT** — chờ thầy chơi thử ở `http://localhost:5510/templates/open-the-box/test.html` và xác
nhận ưng trước khi lưu/đẩy GitHub. Đợt này đi cùng lô với các đợt 11–16 (đều đang chờ duyệt).

### 31/7/2026 (đợt 16) — Bỏ tiếng THỪA khi trả lời SAI (2 tiếng → 1)

Thầy báo: bấm sai 1 đáp án hiện phát **2 âm thanh** cho cùng 1 sự kiện — thừa 1. Rà lại: khi sai có
`otbSound.wrong()` (tiếng "incorrect", phát NGAY lúc bấm) rồi lại `otbSound.tileEliminate()` (tiếng
"tileeliminate", phát SAU khi đóng lúc ô bị khóa về lưới). Hai tiếng cho cùng một hành động sai.

**Sửa**: bỏ dòng `if (!correct) otbSound.tileEliminate();` trong callback đóng của `answer()`. Giữ
`otbSound.wrong()` (tiếng thứ nhất, phát ngay). File `tileeliminate.mp3` nay không dùng tới (giữ lại
trong `sounds/` phòng sau này cần).

**Test bằng `javascript_tool`** (chặn `HTMLMediaElement.prototype.play` ghi lại mp3 thực sự phát): sau
khi bấm SAI chỉ còn `incorrect-02` (+ vài `clocktick` của đồng hồ, không liên quan) — KHÔNG còn
`tileeliminate`; ô vẫn khóa đúng (`is-locked`). 0 lỗi console.

**File đổi**: `open-the-box.js` (bỏ 1 dòng gọi `tileEliminate` trong `answer()`).

**CHƯA COMMIT** — cùng lô với đợt 14+15, chờ thầy duyệt xong mới lưu/đẩy GitHub.

### 31/7/2026 (đợt 15) — Chiều ĐÓNG: cho các ô số hiện lại MUỘN hơn (trễ 400ms) thay vì ngay từ đầu

Thầy chơi bản đợt 14: chiều MỞ (ô số → ô câu hỏi) đã ưng; chiều ĐÓNG thì "các ô số khác hiện ra hơi
sớm" — muốn chúng hiện muộn hơn một chút.

**Sửa**: thêm hằng `CLOSE_BOX_FADE_DELAY_MS = 400` (chỉ áp cho chiều ĐÓNG). Hiệu ứng mờ-hiện của ô số
(`is-appearing-fade`) nay có `--otb-fade-delay` = 400ms (giữ ẩn qua `both`/backwards-fill trong lúc trễ),
và JS RÚT thời lượng fade xuống còn `ZOOM_TRANSFORM_MS − 400` để nó vẫn KẾT THÚC đúng lúc màn câu hỏi bị
gỡ (1.2s) → không bị snap. Chiều MỞ (fade-out) KHÔNG đổi (không trễ) — thầy đã ưng.

**Test bằng `javascript_tool`** (đo mỗi ~110ms, mốc 0 = lúc bắt đầu đóng): ô số giữ `opacity 0` suốt
~340ms đầu rồi mới mờ hiện `.20 → .50 → .74 → .87 → .95 → .99` ở ~700ms còn lại (kết thúc ~1.2s, không
snap); ô câu hỏi VẪN co liên tục từ đầu `.995 → .479` (đúng kích cỡ ô số). 0 lỗi console.

**File đổi**: `open-the-box.js` (hằng `CLOSE_BOX_FADE_DELAY_MS`, đặt `--otb-fade-delay` + rút `--otb-fade-ms`
trong `closeCardThen`), `open-the-box.css` (thêm `var(--otb-fade-delay)` vào animation `is-appearing-fade`).

**CHƯA COMMIT** — cùng lô với đợt 14, chờ thầy duyệt xong cả 2 mới lưu/đẩy GitHub.

### 31/7/2026 (đợt 14) — HIỆU ỨNG CHUYỂN Ô SỐ ⇄ Ô CÂU HỎI viết lại: 2 lớp CHỒNG NHAU, các ô số MỜ DẦN đồng thời với zoom (không còn "biến mất tức thì")

Thầy chưa ưng hiệu ứng chuyển giữa **ô số** (lưới) và **ô câu hỏi**. Yêu cầu rõ 2 chiều:
1. **Mở** (ô số → ô câu hỏi): ô được bấm zoom PHÓNG TO từ đúng vị trí/kích cỡ ô số gốc thành ô câu hỏi;
   **đồng thời** các ô số khác **ẩn dần (fade)**; các ô đáp án trượt vào. **Cả 3 cùng thời lượng.**
2. **Đóng** (ô câu hỏi → ô số): ô câu hỏi zoom NGƯỢC về đúng vị trí ô gốc; **đồng thời** các ô số khác
   **hiện lại (fade)** và các ô đáp án trượt ra. **Ngược lại hoàn toàn quá trình 1.**

**Nguyên nhân bản cũ không đạt**: `render()` XÓA TRẮNG `root` (`innerHTML=""`) NGAY khi bấm ô → toàn bộ
lưới biến mất tức thì trước khi màn câu hỏi vẽ ra; lúc đóng thì lưới chỉ hiện lại SAU khi zoom xong
(tuần tự, qua callback), lại "pop" bằng scale chứ không fade. Lưới và màn câu hỏi **chưa bao giờ cùng
tồn tại** nên không thể cho ô mờ dần ĐỒNG THỜI với zoom.

**Cách sửa (kiến trúc):** trong lúc chuyển, cho lưới và màn câu hỏi **CÙNG nằm trong DOM**, định vị
**tuyệt đối chồng lên nhau** (class `.aw-otb-anim` trên `root` → 2 card con `position:absolute; inset:0`,
card đang zoom `z-index:2` nằm trên). Tách hàm để làm được điều này:
- `buildBoxGrid()` / `buildQuestion()` — chỉ DỰNG DOM, không gắn/không layout/không zoom/không phát âm.
- `animateOpen(i)` (MỞ): dựng màn câu hỏi CHỒNG lên lưới đang có → gỡ `is-entrance`, thêm `is-exiting`
  cho lưới (keyframe `aw-otb-box-fade-out`, thời lượng `--otb-fade-ms = ZOOM_TRANSFORM_MS`); **ẩn NGAY**
  ô được bấm (`opacity:0`) để ô câu hỏi mọc lên từ đúng chỗ đó, tránh chồng số + câu hỏi; zoom ô câu hỏi
  từ rect ô gốc (`zoomElFrom`); đáp án tự trượt vào (keyframe `aw-otb-qtile-in`, đã 1.2s từ đợt 12).
  Xong (`ZOOM_FALLBACK_MS`) mới GỠ lưới cũ.
- `closeCardThen(afterFn)` (ĐÓNG): dựng lưới MỚI (đúng trạng thái solved/locked mới nhất) đặt DƯỚI màn
  câu hỏi, thêm `is-appearing-fade` (keyframe `aw-otb-box-fade-in`) → ô mờ HIỆN lại; đồng thời `.is-closing`
  cho đáp án trượt ra + `zoomElTo` co ô câu hỏi về ô gốc. Xong mới GỠ màn câu hỏi. `afterFn` giờ KHÔNG
  `render()` nữa (lưới đã sẵn) — chỉ lo âm thanh + kiểm tra thắng.
- `finishGameOver()` chỉ `render()` lại nếu lưới CHƯA có (ca hết giờ lúc đang ở lưới).
- Token `animToken` + `clearPending()`: nếu một lượt chuyển mới bắt đầu (bấm nhanh / hết giờ giữa chừng)
  thì callback "xong" của lượt cũ tự bỏ, tránh kẹt 2 lớp DOM.

**BẪY THẬT ĐÃ GẶP VÀ SỬA (quan trọng)**: `zoomElTo` (lúc đóng) chốt "xong" theo `transitionend` của
**BẤT KỲ** thuộc tính nào end trước — mà `opacity` (840ms) end TRƯỚC `transform` (1200ms), nên cả màn
đóng bị **CẮT NGANG ở 840ms**: ô câu hỏi mới co tới scale ~0.54, các ô số mới mờ hiện tới ~0.88 thì
**snap** thẳng về cuối. Bản cũ KHÔNG lộ vì đóng xong là `render()` vẽ lưới đè lên (không thấy ô câu hỏi
co dở); nay 2 lớp chồng nên cú giật hiện rõ. **Sửa**: `zoomElTo` chỉ chốt khi `transitionend` của ĐÚNG
`transform` (1200ms) → cả co ô câu hỏi LẪN fade-in ô số (cùng 1.2s) chạy trọn vẹn rồi mới gỡ card.
(Bài học lặp lại: đo animation phải đo LIÊN TỤC nhiều mốc — bắt được cú cắt 840ms nhờ lấy mẫu mỗi ~120ms.)

**Test bằng `javascript_tool`** (browser thật, `test.html`, lấy mẫu `getComputedStyle` mỗi ~120-130ms
suốt cả 2 chiều):
- **MỞ**: lưới + màn câu hỏi CÙNG tồn tại t=5→1208ms; ô được bấm `opacity=0` ngay; ô KHÁC mờ dần đều
  `1 → .887 → .654 → .424 → .259 → .148 → .075 → .031 → 0`; ô câu hỏi phóng `scale .476 → 1`; đáp án
  trượt vào `tx 518 → 0` — cả 3 ĐỒNG THỜI ~1.2s; t≈1341 gỡ lưới, còn màn câu hỏi.
- **ĐÓNG**: 2 lớp cùng tồn tại t≈1455→2546; ô số mờ HIỆN `.017 → .148 → .369 → .576 → .729 → .835 →
  .908 → .956 → .984 → 1` (mượt, KHÔNG snap); ô câu hỏi co `1 → .477` (đúng bằng kích cỡ ô số — khớp
  chính xác điểm xuất phát .476 lúc mở); đáp án trượt RA `tx 0 → 517`; xong gỡ màn câu hỏi, ô đã bấm hiện
  đúng trạng thái đã trả lời.
- Hồi quy: trả lời ĐÚNG → ô hiện **tích xanh** (solved), về lưới sạch, +điểm; hết giờ → panel **GAME
  OVER** đúng (đường `gameOver → closeCardThen → finishGameOver → shake/nổ → finish` còn nguyên). 0 lỗi
  console suốt toàn bộ. Không đụng `core/` — mọi thay đổi CSS đều prefix `.aw-otb-*`, chỉ nạp khi chơi
  Open the box nên Quiz/Anagram không ảnh hưởng.

**File đổi đợt này**: `open-the-box.js` (tách `buildBoxGrid`/`applyPopEntrance`/`buildQuestion`/`setupFit`;
`animateOpen` mới; `closeCardThen`/`finishGameOver`/callback trong `answer()` viết lại; `zoomElTo` chốt
theo `transform`; thêm `animToken`/`pendingSettle`/`clearPending`), `open-the-box.css` (thêm khối
`.aw-otb-anim*` + keyframe `aw-otb-box-fade-out`/`-in`).

**CHƯA COMMIT** — chờ thầy chơi thử ở `http://localhost:5510/templates/open-the-box/test.html` và xác
nhận ưng trước khi lưu/đẩy GitHub (đúng quy tắc "hỏi trước khi commit" của dự án).

### 31/7/2026 (đợt 13) — SỬA BUG THẬT: hiệu ứng trượt ra của đáp án hoàn toàn không chạy (animation chặn transition)
Thầy báo: sau khi chọn đáp án, các ô đáp án KHÔNG thấy trượt ra mà chỉ biến mất tại chỗ. Đây là **bug
thật, không phải cần chỉnh thêm** — đã có từ trước (rất có thể từ đợt 9, khi hiệu ứng trượt ra lần đầu
được thêm), chỉ là chưa ai đo trực tiếp giữa chừng animation để bắt được, đợt 12 lỡ giữ nguyên bug này khi
đổi tốc độ.

**Nguyên nhân thật**: `.aw-otb-qtile` (mọi ô đáp án) có sẵn 1 `animation` (hiệu ứng trượt VÀO,
`aw-otb-qtile-in`, `fill-mode: both`) áp dụng VĨNH VIỄN ngay từ lúc ô được tạo ra — animation này "giữ"
giá trị cuối (`transform`/`opacity`) MÃI MÃI sau khi chạy xong (do `both`), không bao giờ thật sự "buông"
2 thuộc tính đó. Theo đúng luật CSS: **1 `animation` đang giữ 1 thuộc tính LUÔN thắng bất kỳ `transition`
nào cũng nhắm vào đúng thuộc tính đó** — nên rule `.is-closing` (hiệu ứng trượt RA, viết bằng `transition`
từ đợt 9 tới nay) **chưa bao giờ thực sự chạy được**, dù CSS parse hoàn toàn hợp lệ, không lỗi console.
Ô đáp án cứ đứng yên (bị animation trượt-vào ghim tại chỗ) cho tới khi `render()` xoá cả khung câu hỏi —
nhìn y hệt "biến mất tại chỗ" đúng như thầy mô tả.

**Cách sửa**: đổi hẳn hiệu ứng trượt RA từ `transition` sang 1 `@keyframes` MỚI (`aw-otb-qtile-out`) +
1 `animation` riêng cho `.is-closing` — giờ là animation-đấu-animation (rule có độ ưu tiên cao hơn của
`.is-closing` thắng, thay hẳn animation trượt-vào bằng animation trượt-ra một cách sạch sẽ, không xung
đột gì) thay vì animation-đấu-transition (luôn thua). Khung hình `from` của animation mới khớp CHÍNH XÁC
điểm dừng của animation trượt vào (opacity 1, translateX(0)) nên đổi qua không bị giật/nhảy. Độ trễ so le
từng ô (`animationDelay` gán 1 lần trong JS) vẫn giữ nguyên tác dụng cho CẢ 2 chiều vì style inline luôn
thắng rule class dù đổi tên animation.

**Test bằng `javascript_tool`** (đo `getComputedStyle` LIÊN TỤC mỗi ~90ms suốt quá trình thoát, không chỉ
đo điểm đầu/cuối như các lần trước — bài học rút ra: đo 2 đầu không đủ để bắt lỗi "đứng yên rồi biến
mất" kiểu này): xác nhận `translateX` tăng dần mượt 2→27→93→220→386→527→626→695→743px cùng lúc `opacity`
giảm dần 0.997→0.967→0.887→0.732→0.530→0.359→0.237→0.153→0.095 — animation trượt ra giờ chạy thật, mượt,
liên tục. 0 lỗi console.

**Ghi chú thêm cho phiên sau**: cùng nguyên nhân gốc (animation `both` ghim vĩnh viễn `transform`) rất có
thể cũng đang âm thầm chặn `transition: transform .06s ease` mà `.aw-otb-qtile` khai báo cho hiệu ứng bấm
(`:active { transform: translateY(0.4cqw); }`) — CHƯA kiểm chứng việc này (thầy không báo, không phải
phạm vi lần sửa này), ghi lại phòng khi thầy để ý thấy nút bấm không có phản hồi lún xuống.

**File đổi đợt này**: `open-the-box.css` (thêm `@keyframes aw-otb-qtile-out`, đổi `.is-closing` từ
`transition` sang `animation`), `open-the-box.js` (bỏ dòng `transitionDelay` không còn dùng tới, sửa
comment).

**CHƯA COMMIT** — chờ thầy xác nhận đã ưng trước khi lưu/đẩy lên GitHub.

### 31/7/2026 (đợt 12) — ô sai chuyển đỏ trắng, ĐẢO NGƯỢC lại thứ tự zoom/trượt của đợt 11 (quay về đồng thời, khớp thời lượng), sửa lỗi lỡ nhịp tick 5 giây cuối
Thầy tự chơi bản đợt 11 xong, báo tiếp 4 điểm — trong đó có 2 điểm (mục 2, 3 dưới) là **ĐẢO NGƯỢC**
quyết định vừa làm ở đợt 11 (đợt 11 làm cho zoom xong mới trượt/trượt xong mới zoom — thầy thử xong lại
muốn quay về chạy ĐỒNG THỜI như cũ, chỉ cần khớp thời lượng cho đều mắt hơn):

1. **Ô bị khoá (chọn sai) chuyển hẳn sang nền ĐỎ đặc, chữ trắng, khoá trắng**: trước đó (đợt 6) ô sai
   hiện kiểu "trắng đen" bằng `filter: grayscale(1)`. Bỏ hẳn filter đó, đổi `background`/`border-color`
   của mặt sau ô thành `#ef4444` (đỏ), chữ câu hỏi + icon khoá đổi sang trắng (`#fff`).
2. **ĐẢO NGƯỢC lại đợt 11 mục 2 — zoom ô câu hỏi và trượt vào của đáp án chạy ĐỒNG THỜI, khớp thời
   lượng**: đợt 11 làm cho đáp án CHỜ ô câu hỏi zoom xong mới trượt vào (tuần tự). Thầy thử xong muốn
   quay lại chạy cùng lúc như trước đợt 11, nhưng lần này bắt 2 khoảng thời gian animation **bằng nhau
   tuyệt đối**: xoá hẳn class `.is-pending` + tham số `onDone` mới thêm ở đợt 11 (không cần nữa), đổi
   thời lượng CSS của hiệu ứng trượt vào (`aw-otb-qtile-in`) từ `.38s` lên **`1.2s`** — khớp CHÍNH XÁC
   hằng số `ZOOM_TRANSFORM_MS` (thời lượng zoom ô câu hỏi) trong `open-the-box.js`.
3. **ĐẢO NGƯỢC lại đợt 11 mục 3 — đáp án trượt ra và ô câu hỏi zoom ra cũng chạy ĐỒNG THỜI, khớp thời
   lượng**: tương tự mục 2 nhưng cho lúc đóng. Xoá hẳn logic "chờ đáp án trượt ra xong hẳn" mới thêm ở
   đợt 11 (`closeCardThen`/`answer()` trở lại y hệt bản đợt 10: thêm `.is-closing` và gọi `zoomElTo` NGAY
   trong cùng 1 lượt, không còn `setTimeout` chờ); đổi thời lượng CSS của hiệu ứng trượt ra (`.is-closing`)
   từ `.6s` lên **`1.2s`** — khớp `ZOOM_TRANSFORM_MS` y hệt mục 2. Xoá hằng số `TILE_EXIT_MS` (không còn
   cần tính thời gian chờ động nữa).
4. **Sửa lỗi lỡ nhịp tiếng tick ở mốc 5 giây cuối**: bắt được nguyên nhân thật — code cũ có 1 biến cờ
   `halfMode` để chuyển từ tích đơn (1 lần/giây) sang tích đôi (2 lần/giây); đúng lúc cờ này bật lên
   (mốc 5 giây), nó tự khởi tạo giá trị so sánh MỚI bằng CHÍNH giá trị `remaining` đang được so sánh
   trong CÙNG 1 lượt — nên phép so sánh luôn ra "bằng nhau", tiếng tick đúng lúc 5 giây không bao giờ
   phát ra (lỡ mất 1 nhịp trước khi tích đôi bắt đầu). Sửa: bỏ hẳn cờ `halfMode`, gộp thành 1 công thức
   DUY NHẤT tính "khe tick" (giây nguyên khi còn >5s, nửa giây khi ≤5s) rồi so sánh 1 chỗ — không còn
   khởi tạo trùng giá trị đang so sánh nữa nên hết lỡ nhịp.

**Test bằng `javascript_tool`** (browser thật, `test.html`, chặn/ghi log hàm `otbSound.clockTick` để đo
đúng mốc thời gian mỗi tiếng tick thay vì đoán bằng tai): đo được chuỗi tick tại giây 14,13,...,6,5 cách
đều 1000ms (không lỡ nhịp ở mốc 5), rồi NGAY 497ms/503ms sau là 2 tick đôi đầu tiên — đúng như mong đợi,
không còn khoảng trống. Chọn sai 1 ô xác nhận ô hiện đúng nền đỏ (`rgb(239,68,68)`) + chữ/khoá trắng
(`rgb(255,255,255)`) qua ảnh chụp lẫn `getComputedStyle`. Đo `transform` của ô câu hỏi VÀ ô đáp án ngay
sau khi mở hộp xác nhận cả 2 cùng biến đổi từ thời điểm 0 (đồng thời, không còn chờ nhau) ở cả lúc mở lẫn
lúc đóng. 0 lỗi console suốt quá trình. Hồi quy: Quiz/Anagram không đụng gì (core chỉ `core/app.css`
`.has-inline`, đã scoped riêng Open the box).

**File đổi đợt này**: `open-the-box.css` (nền/màu ô khoá đổi hẳn sang đỏ-trắng thay filter xám; xoá rule
`.is-pending`; đổi thời lượng `aw-otb-qtile-in`/`.is-closing` về `1.2s` khớp zoom), `open-the-box.js`
(xoá hằng `TILE_EXIT_MS`; `renderQuestion`/`closeCardThen`/`answer`/`zoomElFrom` revert về chạy đồng thời;
viết lại `runCountdown` bỏ cờ `halfMode`, dùng công thức "tick slot" thống nhất). *(Lưu ý đánh số: đợt
này + đợt 11 trước đó dùng số đợt RIÊNG của file này — khác với số "đợt 13/14" ghi trong
`APP_MASTER.md`, vốn đếm chung cho toàn dự án AWord chứ không chỉ Open the box.)*

**CHƯA COMMIT** — chờ thầy xác nhận đã ưng trước khi lưu/đẩy lên GitHub.

### 31/7/2026 (đợt 11) — 4 tinh chỉnh sau khi thầy tự chơi bản đã gộp trang chủ: canh đều 2 mép, thứ tự zoom/trượt, đồng hồ dừng chờ ô kế
Thầy tự chơi bản live xong, báo 4 điểm cần chỉnh — không có điểm nào chưa rõ, code thẳng không cần hỏi
thêm lần này:

1. **Canh đều 2 mép**: mép trái đồng hồ tới mép trái khung app = mép phải điểm số tới mép phải khung
   app. Trước đó (đợt 10) cột đồng hồ được cố định `1.6cqw` để mép đồng hồ THẲNG mép ô câu hỏi (mục
   tiêu khác, thầy từng yêu cầu) — mục tiêu đó nay **bị thay bằng mục tiêu mới này** (đổi cột về `0` thay
   vì `1.6cqw` trong `core/app.css` `.aw-topbar.has-inline`). Đo bằng `javascript_tool`
   (`getBoundingClientRect()` so với khung `.aw-stage`): 2 khoảng cách ra đúng bằng nhau
   **22.25px cả 2 bên**.
2. **Ô câu hỏi zoom xong xuôi rồi đáp án mới trượt vào**: trước đó (đợt 9-10) cả 2 hiệu ứng chạy CÙNG
   LÚC. Thêm class `.is-pending` (giữ nguyên ô đáp án ở đúng vị trí "chưa xuất hiện" — mờ hẳn + đẩy ra
   ngoài mép phải, không animation) cho tới khi `zoomElFrom()` (hiệu ứng zoom ô câu hỏi) báo xong qua
   callback `onDone` mới thêm — lúc đó gỡ `.is-pending`, ô đáp án bắt đầu trượt vào lại từ đầu (khớp y
   hệt trạng thái hình ảnh lúc đang chờ nên không giật/nhấp nháy). Đo bằng `javascript_tool`: ô câu hỏi
   zoom xong (`transform` về `none`) đúng lúc `.is-pending` được gỡ, ở mốc **~848ms** sau khi bấm ô số.
3. **Khi biến mất: đáp án trượt ra XONG HẲN (kể cả độ trễ so le từng ô) rồi ô câu hỏi mới zoom ra**: đây
   là sửa 1 lỗi thật — trước đó thời gian chờ trước khi zoom ô câu hỏi là hằng số cố định
   (`TILE_EXIT_MS`, không tính thêm độ trễ so le mỗi ô), nên với >1 đáp án, ô câu hỏi đã bắt đầu zoom ra
   TRƯỚC KHI vài ô đáp án cuối trượt ra xong. Sửa: tính thời gian chờ ĐỘNG = độ trễ so le của ô cuối
   cùng + `TILE_EXIT_MS` (áp dụng ở cả 2 nơi gọi `closeCardThen()` — sau khi chọn đáp án VÀ khi hết giờ
   giữa lúc đang mở câu hỏi, trước đó chỉ nơi đầu có chờ, nơi hết giờ chạy đồng thời luôn). Cũng làm
   **chậm hẳn tốc độ trượt ra** (300ms → 600ms, thầy yêu cầu "chậm hơn hiện tại"). Đo bằng
   `javascript_tool`: bấm đáp án đúng → đúng 947ms sau mới bắt đầu trượt ra (khớp hiệu ứng tích xanh bay
   lên trước) → về lưới ở mốc 2517ms — khớp chính xác phép tính 947 + (135ms so le ô cuối + 600ms trượt)
   + 840ms zoom ra ≈ 2522ms.
4. **Trả lời đúng: đồng hồ reset về đầy rồi DỪNG hẳn, chỉ chạy tiếp khi bấm ô câu hỏi kế tiếp**: đợt 9
   từng làm đồng hồ tự chạy tiếp NGAY sau khi đầy lại (kể cả lúc đang đứng ở lưới suy nghĩ ô nào bấm
   tiếp) — thầy nay yêu cầu đổi khác: đứng yên ở lưới thì không mất giờ, giờ chỉ trôi khi đang thực sự
   mở 1 câu hỏi. Thêm cờ `pausedForNextBox`: `resetSharedTimer()` (gọi khi trả lời đúng) không tự gọi
   lại `runCountdown()` nữa, chỉ bật cờ; `openBox()` là nơi DUY NHẤT gỡ cờ + gọi `runCountdown()` lại.
   Sai vẫn giữ nguyên hành vi cũ (đồng hồ chạy liên tục, không dừng) — thầy chỉ yêu cầu đổi cho trường
   hợp ĐÚNG. Đo bằng `javascript_tool`: sau khi trả lời đúng, đồng hồ đứng yên "0:15" suốt 2 giây đứng ở
   lưới; bấm ô kế tiếp thì bắt đầu giảm ("0:14") ngay trong vòng 1 giây sau.

**Test bằng `javascript_tool`** (browser thật, `test.html`, đo `getBoundingClientRect`/`getComputedStyle`
theo mốc thời gian thay vì chỉ nhìn ảnh chụp — animation quá nhanh để bắt đúng bằng mắt): cả 4 điểm đều
đo được số liệu khớp chính xác mô tả ở trên. Hồi quy: chơi lại 1 câu sai → khoá xám vẫn đúng, đồng hồ vẫn
chạy tiếp không dừng (không bị đổi theo nhầm cờ mới); Quiz/Anagram không đụng gì (mọi thay đổi core chỉ ở
`.has-inline`, đã scoped riêng Open the box từ đợt 8). 0 lỗi console suốt quá trình.

**File đổi đợt này**: `core/app.css` (`.aw-topbar.has-inline` cột 1 đổi `1.6cqw`→`0`), `open-the-box.css`
(comment cập nhật theo mục 1, thêm rule `.is-pending`, đổi tốc độ `.is-closing` `.3s`→`.6s`),
`open-the-box.js` (header đổi mô tả timer, hằng số `TILE_STAGGER_MS` mới + `TILE_EXIT_MS` 300→600,
`zoomElFrom` thêm callback `onDone`, `renderQuestion`/`answer`/`closeCardThen`/`resetSharedTimer`/
`openBox` viết lại theo 4 mục trên).

**CHƯA COMMIT** — chờ thầy xác nhận đã ưng trước khi lưu/đẩy lên GitHub (đúng quy tắc "hỏi trước khi
commit" của dự án).

### 30/7/2026 (đợt 10) — đồng hồ thẳng mép ô câu hỏi, tách zoom ô số/trượt đáp án, sửa lỗi thật của việc căn giữa hàng cuối
Thầy test đợt 9 xong, báo 3 điểm cần chỉnh — 1 trong số đó (căn giữa hàng cuối) hoá ra là **bug thật**
của đợt 9, không phải chỉnh thêm:

1. **Đồng hồ + thanh giờ dịch hẳn sang trái, mép trái đồng hồ THẲNG mép trái ô câu hỏi**: đợt 9 dùng cột
   `auto` cho ô đồng hồ ẩn của engine (`.aw-topbar`), khiến `ui.topbarMid` bắt đầu ở một vị trí KHÔNG
   xác định trước (tuỳ độ rộng chữ "0:00" ẩn). Đổi `core/app.css` sang cột **CỐ ĐỊNH `1.6cqw`** — đúng
   bằng padding của `.aw-otb-qcard` — nên mép trái của `ui.topbarMid` (và đồng hồ bên trong) rơi ĐÚNG
   vào mép trái ô câu hỏi, đo bằng `getBoundingClientRect()` ra lệch **0px**. Khoảng cách bên phải trước
   khi chạm điểm số chuyển từ `column-gap` chung (ảnh hưởng cả 2 bên) sang `padding-right` riêng của
   `.aw-otb-q-topbar` (chỉ ảnh hưởng bên phải, không phá mép trái vừa canh xong).
2. **Tách hẳn 2 hiệu ứng**: trước đây CẢ khối câu hỏi+đáp án zoom chung 1 khối (`.aw-otb-qcard`). Nay
   CHỈ ô câu hỏi (`.aw-otb-q-question`) zoom từ vị trí Ô SỐ ra/vào (đổi `zoomCardFrom/To` thành
   `zoomElFrom/To` nhận tham số phần tử bất kỳ); các ô đáp án KHÔNG zoom nữa — chỉ trượt bằng
   `translateX` thuần, khoảng cách tăng lên **85cqw** (tính theo bề rộng KHUNG GAME thật, không phải
   theo ô) để chắc chắn trượt từ ngoài mép phải màn hình vào, đúng ý "mép phải MÀN HÌNH" chứ không phải
   chỉ lệch nhẹ trong lòng ô như đợt 9. Đã đo `getComputedStyle(...).transform` giữa lúc đang zoom: ô
   câu hỏi ra ma trận có hệ số scale ≠ 1 (đang phóng to), ô đáp án ra ma trận scale=1 (chỉ dịch ngang) —
   xác nhận đúng tách biệt.
3. **BUG THẬT của đợt 9 — hàng cuối "căn giữa" nhưng không thấy centered**: đọc lại kỹ CSS Grid spec
   phát hiện 2 lớp vấn đề chồng nhau:
   - Lớp 1 (đã tưởng đã sửa nhưng chưa đủ): chỉ gán `grid-column` cho hàng cuối mà không gán `grid-row`
     — theo đúng spec, phần tử có cột tường minh nhưng hàng tự động được xếp TRƯỚC các phần tử hoàn
     toàn tự động trong thuật toán auto-placement, có thể nhảy lên hàng SỚM hơn dự tính. Test lại xác
     nhận gán tường minh CẢ `grid-row` lẫn `grid-column` cho MỌI ô thì đúng hàng, nhưng...
   - Lớp 2 (nguyên nhân THẬT sự của "không thấy giữa"): với số ô lẻ (vd 1 ô còn lại trong lưới 4 cột),
     vị trí "giữa nhất" mà CSS Grid nguyên cột cho phép vẫn lệch hẳn khỏi tâm thật (đo: ô nằm ở 37.5%
     thay vì đúng 50% bề ngang) — vì không thể chia 1 cột nguyên làm đôi. **Giải pháp đúng**: bỏ hẳn CSS
     Grid, đổi `.aw-otb-grid` sang **Flexbox `flex-wrap:wrap` + `justify-content:center`** — flexbox
     canh giữa TỪNG HÀNG ĐƯỢC XUỐNG DÒNG một cách LIÊN TỤC (không theo bước cột), nên hàng nào cũng
     giữa tuyệt đối, không cần tính `centerOffset` gì trong JS nữa.
   - **Bẫy phát sinh khi đổi sang Flexbox (bắt được lúc test, không phải đoán)**: cỡ ô (`--cell`) đôi
     khi bị giới hạn bởi CHIỀU CAO (không đủ hàng cho vừa) chứ không phải chiều rộng — khi đó ô NHỎ hơn
     mức "vừa đúng N ô/hàng" cần, khiến khung rộng hết cỡ thẻ chứa được NHIỀU HƠN N ô/hàng (đo trực
     tiếp: ép `cols:4` với 9 ô, kỳ vọng 4+4+1 nhưng ra thật 6+3!). Sửa bằng cách CHỐT khung
     `.aw-otb-grid` đúng bằng `cols*cell+gaps` (không để nó giãn hết bề ngang thẻ cha), CĂN GIỮA khung
     đó trong `.aw-otb-card` bằng `align-self:center`. Đo lại xác nhận đúng 4+4+1 và ô lẻ hàng cuối lệch
     tâm khung đúng **0.5px** (sai số làm tròn, coi như 0).

**Test bằng `javascript_tool`** (browser thật): đo `getBoundingClientRect()` xác nhận mép trái đồng hồ
= mép trái ô câu hỏi tuyệt đối; đo `transform` giữa lúc zoom xác nhận ô câu hỏi có scale, ô đáp án chỉ
có translate; ép `options.columns=4` với 9 ô qua console (`import()` lại module mẫu, sửa thẳng
`activity.options` rồi Start again) → xác nhận đúng 4+4+1 hàng, tâm ô lẻ hàng cuối trùng tâm khung sai
số 0.5px; chạy hết ván 9/9 đúng tự động → "GAME COMPLETE", 0 lỗi console. Hồi quy Quiz: `.aw-topbar`
vẫn `display:flex`, className thuần, không đổi gì.

**File đổi đợt này**: `core/app.css` (`.has-inline` cột 1 cố định `1.6cqw`), `open-the-box.css`
(`.aw-otb-grid` đổi Grid→Flexbox, keyframe đáp án đổi khoảng cách 85cqw, `.aw-otb-q-topbar` thêm
padding-right), `open-the-box.js` (`layoutGrid` bỏ hẳn tính `grid-row/column`, chốt width khung;
`zoomCardFrom/To`→`zoomElFrom/To` tổng quát; `renderQuestion`/`closeCardThen` chỉ nhắm zoom vào ô câu
hỏi).

**ĐÃ COMMIT + PUSH GITHUB** (commit `a2db784`, 30/7/2026, gộp chung đợt 8+9+10 — thầy nói "lưu, commit
+ git push").

### 30/7/2026 (đợt 9) — thanh giờ full-width, đồng hồ chạy LIÊN TỤC (kể cả ở màn lưới), zoom chậm gấp đôi, đáp án trượt phải
Thầy tự chơi đợt 8 xong, gửi 9 điều chỉnh liền — không có điểm nào chưa rõ (mô tả chi tiết đủ để code
thẳng, không cần AskUserQuestion đợt này):

1. **Thanh giờ full-width + đối xứng + đỏ dần + tích gấp đôi**: `core/app.css` đổi `grid-template-
   columns` của `.aw-topbar.has-inline` từ `1fr auto 1fr` sang **`auto 1fr auto`** (cột giữa giờ ăn hết
   khoảng trống còn lại thay vì auto-theo-nội-dung) + `.aw-topbar-mid{width:100%}`. Đồng hồ số nằm ở
   MÉP TRÁI của khối giữa (đối xứng với điểm ở mép phải khối phải), thanh giờ `flex:1 1 auto` lấp hết
   khoảng còn lại — tự nhiên "chạy từ sát điểm số về đến đồng hồ" vì thanh vốn co từ phải sang trái khi
   cạn (mặc định của CSS width transition, không cần đổi gì thêm). Còn ≤5 giây: thêm class `.is-warning`
   (nền đỏ `#dc2626`, có trong chuỗi `transition` cùng `width` nên đổi màu MƯỢT chứ không giật) + tích
   chuyển sang **nửa giây/lần** (theo dõi "khe nửa giây" riêng khi vào vùng cảnh báo, x2 tần suất đúng
   yêu cầu).
2. **Zoom lưới lúc START = 2.46s đúng độ dài nhạc**: đo `intro.mp3` thật bằng `ffmpeg -i` (không có
   ffprobe trên máy, dùng ffmpeg đọc dòng "Duration" trong stderr) ra đúng **2.46 giây**. Mỗi ô tự zoom
   trong 900ms, độ trễ so le tính theo công thức `(i/(N-1)) * (2460-900)` để ô CUỐI CÙNG luôn kết thúc
   đúng lúc nhạc dứt — công thức tự co giãn theo số ô (9 ô hay 100 ô đều khớp nhạc).
3. **Bỏ âm "xột xoạt" thừa lúc START**: tìm ra nguyên nhân — mount() gọi `shuffle()` xáo câu hỏi VÀ
   phát luôn `otbSound.shuffle()` cùng lúc với tiếng Intro (cả hai cùng kích hoạt bởi 1 cú bấm PLAY) →
   nghe như 2 tiếng chồng nhau. Bỏ hẳn lệnh gọi âm thanh đó (vẫn xáo câu hỏi bình thường, chỉ bỏ tiếng).
   Test xác nhận qua `read_network_requests`: bấm PLAY giờ chỉ tải đúng `intro.mp3` + `tileappear.mp3`
   (không còn `shuffle.mp3`).
4. **Căn giữa hàng cuối thiếu ô**: `layoutGrid()` tính `offset = floor((cols - soLuongHangCuoi) / 2)`
   rồi gán `grid-column` TƯỜNG MINH cho từng ô hàng cuối (`Math.floor` chia đều phần trống 2 bên; nếu
   phần trống là số lẻ thì bên phải dư 1 cột — không thể chia đôi 1 cột nguyên, đây là giới hạn toán học
   của lưới rời rạc chứ không phải lỗi). Các hàng đầy phía trên giữ nguyên `grid-column` rỗng (auto-flow
   mặc định).
5. **Zoom Ô SỐ→Ô CÂU HỎI chậm gấp đôi**: `ZOOM_TRANSFORM_MS` 600→**1200ms**, `ZOOM_OPACITY_MS` 420→
   **840ms** (giữ đúng tỷ lệ cũ, cả 2 chiều mở/đóng vẫn dùng chung hằng số như các đợt trước — khớp luôn
   với mục 6 bên dưới).
6. **Đồng bộ zoom in/out lúc đóng**: hiệu ứng "pop lưới" (mục 2) giờ áp dụng ở **MỌI lần** `renderGrid()`
   chứ không chỉ lần đầu — quay về lưới sau khi trả lời cũng thấy các ô zoom vào, không chỉ "phựt" hiện
   ra. Lần đầu (sau START) vẫn dùng bộ hằng số CHẬM khớp nhạc (mục 2); các lần sau dùng bộ NHANH riêng
   (~550ms tổng, 320ms/ô) để không làm chậm nhịp chơi — tiếng "Ô xuất hiện" (tileAppear) CHỈ phát lần
   đầu, không lặp lại mỗi câu (tránh ồn).
7. **Đáp án trượt từ phải vào/ra**: đổi hẳn keyframe `aw-otb-qtile-in` từ phóng-to-mờ-dần sang
   `translateX(30%)→0`. Thêm class `.is-closing` (gán qua JS ngay sau khoảng chờ xem dấu ✓/✗ cũ) làm
   toàn bộ ô đáp án trượt ngược ra phải + mờ dần (300ms) TRƯỚC KHI thẻ câu hỏi mới bắt đầu zoom về ô —
   dùng `transition-delay` so le same-key với `animation-delay` lúc vào để cả 2 chiều cùng nhịp.
8. **Đúng → thanh giờ "đầy ngược trở lại"**: viết `resetSharedTimer()` — thay vì nhảy thẳng về 100%,
   GHIM độ rộng HIỆN TẠI (đo bằng `getComputedStyle`) làm điểm xuất phát, bật transition 500ms rồi mới
   đặt đích 100% (đúng kỹ thuật ép-vẽ-lại `void el.offsetWidth` đã dùng cho zoomCardFrom/To) — thanh
   thật sự "đầy dần lên" thấy được, không giật. Chữ số đồng hồ reset về đủ giây NGAY (không hoạt hình
   riêng, chỉ thanh mới có hiệu ứng).
9. **KIẾN TRÚC LẠI toàn bộ đồng hồ — 1 bộ đếm DUY NHẤT chạy liên tục**: đây là thay đổi lớn nhất đợt
   này. Trước đây `startTimer()`/`stopTimer()` gắn liền với từng lần mở Ô CÂU HỎI (dừng khi về lưới).
   Nay tách thành `startSharedTimerIfNeeded()` (chỉ chạy 1 lần — lúc mở Ô SỐ đầu tiên cả ván) +
   `runCountdown()` (tự chạy tới 0 bất kể đang xem lưới hay đang mở câu hỏi) + `resetSharedTimer()` (chỉ
   gọi khi ĐÚNG). Sai → KHÔNG gọi gì cả, bộ đếm cứ thế chạy tiếp xuyên suốt kể cả lúc đang nhìn lưới chọn
   ô tiếp theo — hết giờ lúc đó thì `gameOver()` bắn thẳng từ trạng thái lưới (đã có sẵn `closeCardThen`
   tự bỏ qua bước zoom nếu không có thẻ nào đang mở, không cần sửa thêm). `ui.topbarMid` (đồng hồ+thanh)
   dựng ĐÚNG 1 LẦN rồi để yên xuyên suốt (không còn bị xoá/tạo lại mỗi lần đổi màn lưới↔câu hỏi).

**Test bằng `javascript_tool`** (browser thật, canh giờ theo đúng hằng số mới): mở ô → xác nhận
`--otb-appear-delay` ô cuối = 1560ms + 900ms = đúng 2460ms; PLAY chỉ tải `intro.mp3`+`tileappear.mp3`
(không còn shuffle); chọn SAI → đợi hết chuỗi hold+trượt+zoom → xác nhận đồng hồ **vẫn hiện + vẫn đếm**
ở màn lưới (`0:11` khi kiểm) → đợi tiếp cho cạn hẳn **NGAY TẠI MÀN LƯỚI, chưa mở ô nào khác** → đúng
"GAME OVER" (xác nhận đúng yêu cầu "Game Over ngay nếu không kịp"); chọn ĐÚNG → xác nhận thanh giờ nhảy
đích 100% + chữ số về đúng giờ đầy; đợi vào vùng ≤5s → xác nhận class `is-warning` + màu nền đúng
`rgb(220,38,38)`; giữa lúc trả lời sai → xác nhận `.is-closing` được gán đúng lúc (ngay sau hold
1400ms). Hồi quy: Quiz + Anagram — `.aw-topbar` vẫn `display:flex; justify-content:space-between`,
className thuần `aw-topbar`, không dính gì thay đổi ở Open the box. 0 lỗi console suốt toàn bộ.

**File đổi đợt này**: `core/app.css` (đổi `grid-template-columns` của `.has-inline`, 1 chỗ, đã diff),
`open-the-box.js` (viết lại phần lớn — bỏ `startTimer/stopTimer` cũ, thêm bộ đếm chia sẻ mới,
`layoutGrid` thêm căn giữa hàng cuối, hằng số zoom/entrance mới), `open-the-box.css` (keyframe đáp án
đổi hướng, thêm `.is-closing`/`.is-warning`, `.aw-otb-q-topbar` rộng 100%).

**ĐÃ COMMIT + PUSH GITHUB** — xem đợt 10 phía trên, cả 3 đợt (8+9+10) đi chung 1 commit `a2db784`.

**CHỜ TEST TOMKO**: (a) cảm giác zoom + trượt đáp án trên màn lớn có mượt như mong đợi; (b) nghe tiếng
tích gấp đôi 5 giây cuối có rõ ràng không quá dồn dập; (c) đồng hồ chạy xuyên suốt lúc đang ở màn lưới
có gây bất ngờ/khó chịu không (thua ngay khi đang phân vân chọn ô tiếp — đúng yêu cầu nhưng nên xác
nhận cảm giác chơi thật có ổn không).

### 30/7/2026 (đợt 8) — bỏ chế độ Simple, xây content editor, đổi bộ âm thanh, zoom lúc START + gộp thanh giờ/điểm
Thầy chốt 5 việc lớn qua AskUserQuestion (đã hỏi + chờ "ok build" đúng quy trình):

1. **Bỏ hẳn chế độ Simple** — chỉ còn Questions. `mountSimple()` + option `boxesAutoClose` xoá khỏi
   `open-the-box.js`. Câu hỏi giờ bắt buộc ≥2 đáp án + 1 đáp án đúng, chặn ở CẢ editor (validate trước
   Save) LẪN runtime (lọc phòng thủ, phòng dữ liệu cũ/sửa tay).
2. **`open-the-box-editor.js` (mới)** — gần như copy nguyên `quiz-editor.js` (hình dạng dữ liệu giống
   hệt Quiz), đổi field `items` thay `questions`, nhãn "Box N", giới hạn 2–100 hộp theo đúng luật
   Wordwall thật (`../../docs/04-OPEN-THE-BOX.md`). Wire qua `otbTemplate.edit` — không cần sửa
   `main.js`/`core/engine.js` cho việc này (hợp đồng `tpl.edit` đã có sẵn).
3. **Đổi hẳn bộ âm thanh** sang 15 file gốc Wordwall thầy tải riêng (không còn mượn Anagram). ⚠️ **tên
   gameOver/timesUp thầy chốt NGƯỢC với tài liệu gốc của chính bộ âm thanh** (file GHI CHU.md trong bộ
   âm thanh: TimesUp = tiếng "keng" lúc hết giờ, GameCompleted = tiếng thắng) — thầy muốn **GameOver =
   thua vì hết giờ, TimesUp = thắng (mở hết hộp)**, đã build ĐÚNG theo lời thầy, file gốc
   "GameCompleted" vì vậy KHÔNG dùng tới (ghi rõ ở đây phòng thầy muốn đổi lại sau). Thêm ClockTick
   (tích mỗi giây), Shuffle, TileAppear (lúc lưới hiện ra đầu ván), TileEliminate (lúc 1 hộp bị khoá).
   Tiện sửa luôn 1 lỗi nhỏ từ đợt 7: hook `sounds.complete` (chạy ở MỌI `ui.finish()`, kể cả thua) từng
   lỡ gán tiếng thắng — bỏ hẳn hook đó để khỏi phát 2 tiếng chồng nhau lúc thua.
4. **Zoom lúc bấm START**: lưới hộp hiện ra nhỏ hơn (scale .72) rồi zoom về cỡ chuẩn, so le nhẹ theo
   ô, CHỈ ở lần render đầu mỗi ván (không lặp lại khi quay về lưới giữa ván). An toàn với bẫy
   transform+animation vì `.aw-otb-box` định vị bằng CSS Grid, không phải `transform`.
5. **Gộp thanh giờ + điểm cùng hàng** — việc DUY NHẤT đụng `core/` đợt này, thầy đồng ý qua
   AskUserQuestion với điều kiện chỉ ảnh hưởng Open the box. Thêm cờ `tpl.inlineTimerBar` (opt-in):
   `core/engine.js`/`core/app.css` chỉ thêm khe `ui.topbarMid` (CSS Grid `1fr auto 1fr` trong
   `.aw-topbar`) KHI template khai cờ — không khai thì `.aw-topbar` y hệt flex 2-con cũ. Đã test lại
   Quiz + Anagram xác nhận `topbar.className === "aw-topbar"` (không dính `.has-inline`), 0 lỗi
   console. Đồng hồ+thanh giờ của `open-the-box.js` dời từ trong `.aw-otb-qcard` sang `ui.topbarMid`.

**Test bằng `javascript_tool`** (browser thật): chơi đúng hết 9/9 → "GAME COMPLETE" (đúng gọi
`timesUp`); để hết giờ → "GAME OVER" (đúng gọi `gameOver`); chọn sai → hộp khoá đúng (đúng gọi
`tileEliminate`); Show answers đủ 9 dòng; bảng kết thúc đủ 4 mục. Editor: badge "OPEN THE BOX", 9 thẻ,
nút xoá đáp án tự khoá đúng lúc còn 2, Save chặn đúng khi xoá trắng câu hỏi, Cancel không đụng dữ liệu
gốc. `read_network_requests` xác nhận đủ 16 file mp3 tải 200 OK, không 404. 0 lỗi console (Open the
box lẫn hồi quy Quiz/Anagram).

**File đổi đợt này**: `core/engine.js` + `core/app.css` (2 chỗ mỗi file, đã diff kỹ), `open-the-box.js`
(viết lại), `open-the-box.css`, `otb-sound.js` (viết lại), `sounds/*.mp3` (thay hết 16 file),
`open-the-box-editor.js` (mới), `sample-open-the-box.js` (đổi hẳn sang 9 câu Questions mode).

**ĐÃ COMMIT + PUSH GITHUB** — xem đợt 10 phía trên, cả 3 đợt (8+9+10) đi chung 1 commit `a2db784`.

**CHỜ TEST TOMKO**: (a) cảm giác zoom lúc START trên màn lớn; (b) nghe đủ 16 âm thanh đúng lúc, đặc
biệt cặp GameOver/TimesUp theo đúng nghĩa thầy chốt (ngược tên file gốc); (c) thanh giờ+điểm có thật
sự "cùng hàng" trên màn 86" hay cần chỉnh độ rộng `42cqw` của `.aw-otb-q-topbar`.

### 29/7/2026 (đợt 7) — bảng kết thúc chuyển sang dùng CHUNG hệ thống ui.finish() với Quiz/Anagram
Thầy chốt hướng "sửa core/ ngay" (đã hỏi qua AskUserQuestion vì lúc đó có 1 phiên khác đang sửa
`core/icons.js` — rủi ro đã được thầy chấp nhận). Đây là thay đổi KIẾN TRÚC lớn nhất từ trước tới giờ
của Open the box: bỏ hẳn bảng Game Over tự dựng (đợt 5/6), chuyển sang gọi thẳng `ui.finish()` — CHÍNH
cơ chế Quiz/Anagram dùng — nên có NGAY LẬP TỨC, không cần viết lại: Leaderboard (màn riêng, xếp hạng cục
bộ), Show answers (màn riêng, so đáp án), Start again (remount sạch), Play a different template, cùng
Score/Time y hệt Quiz.

**Sửa `core/engine.js` (rất nhỏ, đã diff kỹ trước khi lưu — chỉ 4 chỗ)**: thêm biến dùng chung
`endTitle` (mặc định `"Game complete"`), `finish(raw)` đọc `raw.title` gán vào đó, `celebrate()` và
`showSummary()` đọc `endTitle` thay vì chữ hard-code cứng trước đây. **Mọi template khác không truyền
`title` thì hành vi y nguyên 100% như cũ** (Quiz/Anagram/Find the match/Type the answer đều không đổi).
Dùng 1 biến dùng chung (không phải tham số hàm) để khi bấm "Back" từ Leaderboard/Show answers quay lại
Summary vẫn giữ đúng tiêu đề gốc, không bị trả về "Game complete" giữa chừng.

**Sửa `open-the-box.js`**:
- Thêm hàm `finishRound(title)`: tự dựng `perQuestion[]`/`review[]` đúng khuôn CONG THUC MAU
  (`{question, answered, yourText, yourCorrect, correctText}`) từ `boxState[]` (mảng "unplayed"/
  "correct"/"locked") rồi gọi `ui.finish({..., title})`.
  - Ô đã **đúng** → `answered:true, yourCorrect:true`.
  - Ô đang **khoá** (mới sai, chưa gỡ khoá) → `answered:true, yourCorrect:false`, `yourText` lấy từ
    mảng MỚI THÊM `lastWrongText[]` (ghi lại đáp án sai gần nhất mỗi ô, phục vụ đúng màn Show answers).
  - Ô **chưa chơi** (kể cả ô từng sai nhưng đã được gỡ khoá lại) → `answered:false`. Đây là 1 sự
    ĐƠN GIẢN HOÁ có chủ đích: game này cho chơi lại nhiều lần/ô (khác Quiz chỉ 1 lần/câu) nên không thể
    ánh xạ hoàn hảo — ghi rõ trong code, không phải thiếu sót.
- Hết giờ (`gameOver()`) → sau khi zoom về lưới + rung + nổ → `finishRound("Game over")`.
- Mở hết TOÀN BỘ ô đúng trước khi hết giờ (thắng) → `finishRound("Game complete")` — đây LẦN ĐẦU TIÊN
  có "màn thắng" đầy đủ (trước đó đợt 5/6 chỉ có `ui.toast("All boxes opened!")` sơ sài).
- **Xoá hẳn** ~90 dòng code cũ: `showGameOverPanel()`, `statBlock()`, `resetGame()`, cùng 4 import
  không cần nữa (`addEntry/getEntries/getRank/updateName` từ `core/leaderboard.js`,
  `fmtSecsParts/ordinal` từ `core/utils.js`) — TOÀN BỘ việc lưu điểm/xếp hạng/tính thời gian giờ do
  chính `core/engine.js` lo (kể cả "Time" — không cần tự theo dõi `gameStartedAt` nữa, xem mục sửa sai
  bên dưới).
- Thêm `sounds: { restart: otbSound.restart, complete: otbSound.allSolved }` vào template — đúng cơ chế
  hook có sẵn `tpl.sounds` mà Anagram cũng dùng (không cần sửa `core/` gì thêm cho việc này).

**⚠️ SỬA SAI 1 nhận định của đợt 6**: đợt 6 từng "sửa lỗi" đồng hồ "Time" bằng cách dời mốc bắt đầu tính
giờ từ lúc mount() sang lúc mở ô đầu tiên, với lý do "mount() chạy ngay khi trang tải, trước cả khi bấm
PLAY". **Lý do đó SAI** — đọc kỹ `core/engine.js` xác nhận `tpl.mount()` chỉ chạy bên trong `begin()`,
mà `begin()` CHỈ được gọi khi bấm nút PLAY (`bigPlay.onclick`), giống hệt lúc engine tự đặt mốc
`startedAt` của chính nó. Vụ "Time tính sai" của đợt 6 nhiều khả năng chỉ là dữ liệu test bị nhiễu từ
các lần chạy trước (nhiều lần quên xoá `localStorage` giữa các lượt test). Dù vậy hướng sửa của đợt 6
(tính giờ từ lúc mở ô đầu) không sai/không hại gì — nhưng từ đợt 7 trở đi việc này KHÔNG CÒN QUAN TRỌNG
vì `core/engine.js` tự tính "Time" đúng chuẩn (từ lúc PLAY) cho mọi template kể cả Open the box, không
cần `open-the-box.js` tự làm nữa.

**Test bằng `javascript_tool`** (tự động click PLAY → mở ô → chọn đáp án, có ca cố tình để hết giờ và
ca tự động trả lời đúng hết cả 6 câu liên tiếp):
- Hết giờ (0/6, chưa trả lời gì) → bảng đúng **"GAME OVER"**, Score 0/6, Time đúng (~5.5s = 4s đếm
  ngược + hiệu ứng), đủ 4 nút Leaderboard/Show answers/Start again/Play a different template.
  - Show answers: hiện đúng cả 6 câu, "No answer" (đúng vì answered:false) + đáp án đúng tô xanh.
  - Leaderboard: bảng RỖNG (đúng, vì `answered=0` — luật có sẵn của engine "không lưu điểm nếu không
    trả lời câu nào", giống Quiz, không phải lỗi).
  - Start again: remount sạch, về đúng màn READY.
- Trả lời đúng cả 6/6 trước khi hết giờ (thắng) → bảng đúng **"GAME COMPLETE"** (khác "GAME OVER" — xác
  nhận `title` hoạt động đúng cho cả 2 chiều), Score 6/6.
- Chế độ Simple (không liên quan) test lại vẫn nguyên vẹn, không hỏng gì. 0 lỗi console suốt toàn bộ.

**File thay đổi đợt này**: `core/engine.js` (4 chỗ, đã diff xác nhận sạch), `templates/open-the-box/
open-the-box.js` (viết lại phần kết thúc ván), `templates/open-the-box/otb-sound.js` (mới, đợt 6),
`templates/open-the-box/sounds/*.mp3` (12 file copy từ Anagram, đợt 6).

**CHƯA LÀM / có thể hỏi thêm nếu thầy cần**: màn "Show answers" không phản ánh được LỊCH SỬ đầy đủ nếu
1 ô bị sai nhiều lần trước khi cuối cùng đúng (chỉ nhớ được lần sai GẦN NHẤT) — chấp nhận được vì đã ghi
rõ lý do trong code, chưa thấy cần thiết phải làm phức tạp hơn.

### 29/7/2026 (đợt 6) — thuật ngữ Ô SỐ/Ô CÂU HỎI, nút góc phải, zoom chậm cả 2 chiều, thanh giờ cao hơn, âm thanh Anagram
Thầy chốt tên gọi: **Ô SỐ** = ô trong lưới chưa mở (số), **Ô CÂU HỎI** = ô đã zoom to hiện câu hỏi+đáp
án — dùng 2 tên này cho nhất quán từ đây. Yêu cầu đợt này:
1. **Nút âm thanh + fullscreen về lại góc phải** (đợt 5 lỡ làm dồn vào giữa khi ẩn thanh Prev/Next).
   Nguyên nhân: `.aw-bottombar` của `core/engine.js` là CSS Grid `1fr auto 1fr` với 3 item auto-đặt theo
   thứ tự DOM; ẩn item giữa (`.aw-nav`) bằng `display:none` khiến nó bị loại khỏi auto-placement
   HOÀN TOÀN → item thứ 3 (nút loa+fullscreen) tự trượt vào cột GIỮA còn trống thay vì ở lại cột 3. Sửa
   bằng 1 dòng CSS ép `.aw-bottombar > .aw-tools { grid-column: 3; }` (vẫn không đụng core/).
2. **Tốc độ zoom CHẬM HƠN NỮA cả 2 chiều** (Ô SỐ→Ô CÂU HỎI và ngược lại) — gộp thành 2 hằng số dùng
   chung `ZOOM_TRANSFORM_MS=600`/`ZOOM_OPACITY_MS=420` (trước là 380/300ms) để 2 chiều luôn khớp tốc độ.
3. **Zoom mượt khi ĐÓNG Ô CÂU HỎI sau khi trả lời** (không chỉ lúc hết giờ như đợt 5) — trước đó bấm xong
   đáp án là "nhảy" thẳng về lưới không hiệu ứng. Refactor thêm hàm dùng chung `closeCardThen(afterFn)`
   (zoom Ô CÂU HỎI co lại đúng vị trí Ô SỐ gốc rồi mới gọi `afterFn`) — dùng ở CẢ 2 chỗ: `answer()` (sau
   khi chọn đáp án) và `gameOver()` (hết giờ), thay vì trước đây chỉ `gameOver()` có zoom.
4. **Thanh giờ dời lên ngang tầm điểm số + ô câu hỏi/đáp án cao hơn**: giảm hẳn `padding-top` của
   `.aw-otb-qcard` (1.4cqw→0.2cqw) và `margin-bottom` của `.aw-otb-q-topbar` (2.2cqw→0.9cqw) để thanh
   giờ nằm sát dưới thanh "✓ N" của engine (không thể chèn thẳng vào ĐÚNG hàng đó vì đó là chrome cố định
   của `core/engine.js`, đây là cách xích lại gần nhất mà không sửa core); phần cao dôi ra tự động chảy
   vào `.aw-otb-q-body` (đã có `flex:1 1 auto`) nên ô câu hỏi/đáp án tự cao hơn, không cần sửa gì thêm.
   - **BẪY THẬT ĐÃ GẶP VÀ SỬA (nghiêm trọng)**: sau khi giảm padding, chữ trong Ô CÂU HỎI/đáp án tự nhiên
     BÉ TÍ HẲN ĐI dù câu ngắn — đo bằng `javascript_tool` (`getComputedStyle(card).getPropertyValue(
     '--fit')`) phát hiện `autoFit` luôn co về mức TỐI THIỂU 0.4 bất kể chữ dài hay ngắn. 2 lỗi cộng
     dồn:
     (a) `.aw-otb-q-question`/`.aw-otb-qtile` là flex/grid item không có `min-height:0` → mặc định
         `min-height:auto` khiến `scrollHeight` LUÔN BẰNG `clientHeight` của chính nó (nó tự "phình" vừa
         đủ chứ không bao giờ thật sự "tràn") → `measure()` của `autoFit` không đo được độ tràn thật.
         Sửa: thêm `min-height:0` cho `.aw-otb-q-question`, `.aw-otb-qtile`, `.aw-otb-q-answers`.
     (b) Ngay cả sau khi sửa (a), vẫn co về 0.4 — do tham số `slack` (khoảng an toàn autoFit chừa cho
         phần không đo được, vd bóng đổ/padding-bottom) đang tính `root.clientWidth*0.045`, một hằng số
         GIẮN VỚI padding CŨ (dày hơn) — sau khi giảm padding thật, phần dư thực tế nhỏ hơn slack yêu
         cầu → autoFit tưởng nhầm là tràn dù chữ vừa khít. Giảm hệ số xuống `*0.02` (khớp đúng lượng
         padding/bóng đổ còn lại thật) là hết co nhầm — đã đo lại `--fit` trả về đúng `1` cho câu ngắn.
     **Bài học: sau MỌI lần đổi padding/margin quanh vùng có autoFit, phải ĐO LẠI `--fit` bằng
     `javascript_tool` (không chỉ nhìn ảnh chụp) để chắc autoFit không âm thầm co sai** — nhìn ảnh chụp
     lúc đầu chỉ thấy "chữ hơi bé", không biết là do BUG hay do chữ dài thật.
5. **Âm thanh giống Anagram**: đã copy 12 file mp3 thật từ `templates/anagram/sounds/` sang
   `templates/open-the-box/sounds/` (KHÔNG cross-import — mỗi template giữ bản riêng, đúng quy ước tự
   chứa) + viết `otb-sound.js` phỏng đúng cấu trúc `anagram-sound.js` (pool ngẫu nhiên không lặp lại
   liên tiếp, tôn trọng nút tắt tiếng chung). Gán: mở Ô SỐ → `blocktilepickup*`; đúng → `blockchipminor*`;
   sai → `blockchipfail*`; hết giờ → `blockgametimeout`; Play again → `blockgamerestart`; mở hết toàn bộ
   Ô trước khi hết giờ → `blockgamesuccessful`.
- **Test bằng `javascript_tool`** xác nhận: nút loa/fullscreen về đúng góc phải; zoom mở/đóng đều mượt
  (~450-600ms, đo `getComputedStyle().transform` liên tục xác nhận scale/opacity đổi dần, không nhảy
  cứng) CẢ lúc trả lời xong lẫn lúc hết giờ; `--fit` trả về đúng `1` cho câu ngắn (không còn co nhầm).
  0 lỗi console suốt quá trình.
- **CHƯA LÀM — cần thầy quyết trước khi code** (xem câu hỏi trong hội thoại): bảng Game Over/Game
  Complete hợp nhất kiểu Quiz/Anagram (Leaderboard/Show answers/Start again/Play a different template).

### 29/7/2026 (đợt 5) — icon tích/khóa, ẩn nút Prev/Next, hiệu ứng zoom mượt, bảng Game Over đủ thông tin
Thầy test đợt 4 xong, yêu cầu thêm 1 loạt tinh chỉnh giao diện + hiệu ứng:
1. **Bỏ số trang + nút Next/Previous** dưới khung — game này bấm Ô BẤT KỲ chứ không phải chuỗi câu tuần
   tự nên thanh đó vô nghĩa. Không có API nào từ `ui` để ẩn thanh đó (thanh `.aw-nav` là chrome CỐ ĐỊNH
   của `core/engine.js`, không có cờ bật/tắt) — thay vì sửa `core/`, thêm 1 dòng CSS `.aw-nav{display:
   none}` NGAY TRONG `open-the-box.css`. Đây KHÔNG phải sửa core (không đụng file core nào) — chỉ vì
   trang chơi Open the box CHỈ nạp đúng CSS của chính nó nên rule này không ảnh hưởng game khác.
2. **Dấu tích ô đúng: trắng→xanh lá, to hơn**. Lý do dấu tích cũ không đổi màu được dù đã set CSS
   `color:#22c55e`: `icons.markCheck` của `core/icons.js` có màu **HARD-CODE cứng trong SVG** (`stroke=
   "#ffffff"`), không dùng `currentColor` nên CSS `color` không có tác dụng — icon đó vốn thiết kế để
   bay lên trên NỀN CÓ MÀU (Quiz), không phải để đổi màu tùy ý. Giải pháp: viết 1 SVG dấu tích RIÊNG
   (`ICON_CHECK_GREEN`, `stroke="currentColor"`) ngay trong `open-the-box.js` — KHÔNG thêm icon mới vào
   `core/icons.js` (đúng luật không sửa core).
3. **Ô sai: trắng đen + hình khóa (cùng vị trí/cỡ dấu tích)**. Hiểu đúng ý thầy: ô trả lời SAI giờ cũng
   **LẬT MỞ** (giống ô đúng) thay vì đóng lại như đợt 3 — hiện câu hỏi (xám) + khóa xám ở đúng vị trí
   thấp mà dấu tích dùng. Thêm `ICON_LOCK` (SVG khóa tự viết, `currentColor`). "Trắng đen" làm bằng
   `filter: grayscale(1)` lên cả mặt sau ô — rẻ hơn nhiều so với tính riêng bản xám cho từng theme.
4. **Hiệu ứng ZOOM mượt khi mở/đóng ô** — đây là việc nặng nhất đợt này:
   - Mở ô: `zoomCardFrom()` — trước khi `render()` xoá lưới, `openBox()` đo `getBoundingClientRect()`
     CHÍNH XÁC của ô vừa bấm (lưu `lastBoxRect`, toạ độ TƯƠNG ĐỐI so với `root`). Màn câu hỏi build xong
     thì "nhảy" tức thì về đúng vị trí/kích cỡ ô đó (transform scale+translate) rồi animate MƯỢT về
     `scale(1) translate(0)` — cảm giác ô "phình to" thành màn hỏi.
   - Hết giờ: `zoomCardTo()` — làm NGƯỢC LẠI (từ full màn thu nhỏ về đúng vị trí ô cũ) TRƯỚC KHI đổi
     sang lưới ô + rung + nổ + bảng Game Over (đúng thứ tự thầy yêu cầu: "zoom về bảng rồi mới rung").
   - **BẪY THẬT ĐÃ GẶP VÀ SỬA**: `zoomCardTo()` bản đầu KHÔNG chạy mượt — nhảy thẳng gần như tức thì
     (đo bằng `javascript_tool` theo dõi `getComputedStyle(...).transform` mỗi 40ms mới phát hiện ra,
     nhìn ảnh chụp không thấy vì animation quá nhanh). Nguyên nhân: thiếu bước ÉP VẼ LẠI
     (`void card.offsetWidth`) giữa lúc đặt giá trị BAN ĐẦU và lúc BẬT transition + đổi sang giá trị
     ĐÍCH — trình duyệt gộp 2 lần đổi CSS làm một, không animate. `zoomCardFrom()` đã làm ĐÚNG bước ép vẽ
     lại này ngay từ đầu (đó là lý do nó chạy mượt ngay lần đầu); `zoomCardTo()` copy thiếu bước đó, đã
     sửa lại đúng cùng khuôn. **Bài học: mọi hàm animate bằng transform từ JS trong app này PHẢI ép vẽ
     lại (`void el.offsetWidth`) giữa bước "đặt giá trị đầu" và bước "bật transition + đổi giá trị
     cuối" — nếu chỉ dựa vào `requestAnimationFrame` là CHƯA CHẮC đủ (đã thấy chạy sai thật với rAF).**
   - Các ô đáp án xuất hiện so le nhẹ (`animation-delay` theo thứ tự) qua keyframe `aw-otb-qtile-in`
     (phóng to dần từ 80% + mờ dần vào) — dùng CSS `animation` thuần (không phải `element.animate()`
     nên không cần setTimeout dự phòng riêng, hiệu ứng chỉ trang trí không quyết định luồng chơi).
5. **Bảng Game Over đủ thông tin như Leaderboard**: gộp Score + Time + hạng + BẢNG XẾP HẠNG cục bộ
   (top 10, `core/leaderboard.js` — tiện ích dùng chung, KHÔNG phải core-internal, an toàn để `import`
   thẳng) + Ô NHẬP TÊN sửa được cho lượt này (y hệt UX bảng Leaderboard của Quiz) + nút Play again — tất
   cả trong 1 bảng (Open the box không có "Show answers" nên không cần tách 2 màn như Quiz).
   - **BẪY THẬT ĐÃ GẶP VÀ SỬA**: "Time" ban đầu tính SAI — đo từ lúc `gameStartedAt = Date.now()` đặt
     NGAY LÚC MOUNT, nhưng `mount()` chạy NGAY khi trang tải xong (đằng sau màn PLAY, TRƯỚC khi thầy bấm
     PLAY) → "Time" cộng luôn cả thời gian thầy đứng nhìn màn PLAY, sai hoàn toàn ý nghĩa "thời gian
     chơi". Sửa: dời mốc bắt đầu tính giờ sang **lúc mở Ô ĐẦU TIÊN** (trong `openBox()`), reset về
     `null` mỗi khi "Play again".
- **Test bằng `javascript_tool`** (đo trực tiếp DOM/`getComputedStyle` theo mốc thời gian thay vì chỉ
  chụp ảnh — animation quá nhanh để chụp đúng khung hình): xác nhận zoom-in mượt (~380ms, transform về
  đúng `none`, dọn sạch inline style); sau khi sửa, zoom-out cũng mượt (~280ms, scale giảm dần 1→0.23,
  opacity giảm dần 1→0.15) RỒI MỚI rung (`shaking:6`) RỒI MỚI nổ (`exploding:6`) RỒI MỚI hiện bảng — đúng
  thứ tự thầy yêu cầu; bảng Game Over hiện đúng Score/Time (đã tính đúng từ lúc mở ô đầu, vd "4.4s" khớp
  đúng tổng 3s đếm ngược + ~1.5s hiệu ứng)/hạng/bảng xếp hạng/tên sửa được. Kiểm tra trực quan qua
  screenshot: dấu tích xanh lá to hơn đúng; ô sai xám trắng đen + khóa cùng vị trí/cỡ dấu tích đúng; số
  lẻ đáp án (3 câu) ô cuối tự giãn hết hàng đúng. 0 lỗi console suốt toàn bộ quá trình test.
- Dữ liệu mẫu **ĐANG TIẾP TỤC để tạm ở chế độ Questions** (giống cảnh báo đợt 4) — sẽ trả về 9 câu
  Speaking prompts SAU KHI thầy xác nhận xong toàn bộ các đợt tinh chỉnh này.

### 29/7/2026 (đợt 4) — bố cục màn hỏi đổi sang TRÁI/PHẢI theo ảnh Wordwall thật thầy gửi
Thầy tự test đợt 3 (xác nhận cơ chế đúng-sai-khoá-GameOver chạy tốt), nhưng gửi thêm 1 ảnh chụp màn hỏi
thật của Wordwall và yêu cầu đổi GIAO DIỆN màn hỏi cho giống: **câu hỏi là 1 Ô LỚN bên TRÁI, 4 đáp án xếp
lưới 2×2 bên PHẢI** (khác hẳn bố cục "câu hỏi trên — đáp án dưới" mà `quiz.js` gốc của app dùng — ảnh
thầy gửi là chụp từ Wordwall thật, không phải Quiz của app), kèm **đồng hồ số "0:10" + thanh giờ nằm
CHUNG 1 hàng ở trên cùng**.
- **`open-the-box.js`**: viết lại `renderQuestion()` — thêm hàng `.aw-otb-q-topbar` (đồng hồ số tự chế +
  thanh giờ, KHÔNG dùng đồng hồ có sẵn của `core/engine.js` vì đồng hồ đó chỉ hỗ trợ 1 kiểu đếm cố định
  cho cả ván, không có API cho template tự set chữ, mà cơ chế "reset khi đúng / chạy tiếp khi sai" của
  đợt này cần logic riêng — xem lý do đầy đủ ở đợt 3). Đồng hồ số chạy bằng `setInterval` 250ms chỉ để
  CẬP NHẬT CHỮ (trang trí), việc "hết giờ" thật vẫn do đúng 1 `setTimeout` như đợt 3 quyết định (không
  đổi độ chính xác). Answers giờ là **CSS Grid 2 cột cố định** (thay flex-wrap nhiều cột theo số lượng) —
  số lẻ (3 hoặc 5 đáp án) thì ô cuối tự giãn hết hàng (`grid-column:1/-1`) cho khỏi trống nửa hàng.
- **`open-the-box.css`**: `.aw-otb-q-body` là flex-row chứa `.aw-otb-q-question` (giờ LÀ 1 tile tô đặc
  màu xanh, không còn chỉ là chữ trần) bên trái + `.aw-otb-q-answers` (grid 2 cột) bên phải; chữ đáp án
  ban đầu neo góc dưới-trái (thử theo cảm giác), thầy chưa góp ý nhưng tự so ảnh thấy lệch — đã sửa lại
  **căn giữa cả ô** (giống ảnh mẫu) ngay trong đợt này, không cần thầy báo thêm.
- **Test qua `test.html`** (dữ liệu mẫu tạm Questions mode 6 câu — ĐANG ĐỂ TẠM Ở CHẾ ĐỘ NÀY, xem cảnh báo
  dưới): xác nhận bố cục đúng ảnh mẫu (đồng hồ+thanh giờ 1 hàng trên, câu hỏi trái, 2×2 đáp án phải, chữ
  đáp án căn giữa), test lại trả lời đúng vẫn cộng điểm + hộp giữ mở đúng như đợt 3 (không hỏng cơ chế
  cũ khi đổi giao diện). 0 lỗi console.
- ⚠️ **CẢNH BÁO cho phiên sau / cuối buổi**: `sample-open-the-box.js` **ĐANG TẠM ở chế độ Questions**
  (6 câu vocab) để thầy test trực tiếp qua link cũ mà không cần đổi gì — **PHẢI trả lại đúng 9 câu
  Speaking prompts (Simple mode) SAU KHI thầy xác nhận xong**, đừng quên (bài học từ lần thầy report
  "chưa thấy câu hỏi" — do session trước lỡ trả về Simple mode ngay sau khi tự test xong, thầy F5 vào
  đúng lúc đó nên không thấy gì).

### 29/7/2026 (đợt 3) — Questions mode viết lại HOÀN TOÀN: quiz-in-a-box + đồng hồ sống còn + Game Over
Thầy yêu cầu tính năng LỚN, đổi hẳn bản chất chế độ "Questions": trước đây bấm hộp chỉ LẬT xem câu hỏi +
đáp án (không tương tác); nay bấm hộp phải hiện MÀN CHỌN ĐÁP ÁN kiểu Quiz thật + 1 đồng hồ đếm lùi DÙNG
CHUNG cho cả ván (không phải mỗi câu 1 đồng hồ riêng như Quiz). Đã hỏi thầy 4 câu qua AskUserQuestion để
chốt đúng luật trước khi code (đồng hồ chạy khi nào / màn Game Over ra sao / có điểm không / ô sau khi
trả lời ra sao) — thầy trả lời rất chi tiết, tóm tắt luật đã code đúng 100% theo mô tả của thầy:
- Đồng hồ **CHỈ chạy khi đang có 1 câu hỏi mở** (đứng yên lúc đang nhìn lưới ô chọn câu tiếp).
- Đúng → **điểm +1, đồng hồ RESET về đủ giây** (số giây cấu hình ở Options, mặc định 15s), ô đó
  **giữ nguyên mở vĩnh viễn** (hiện câu hỏi + đáp án đúng), thêm **dấu tích xanh nhỏ đặt THẤP** dưới đáy ô
  (không đè lên chữ câu hỏi — làm đúng yêu cầu bằng CSS `position:absolute; bottom:...`).
- Sai → **đồng hồ KHÔNG reset, tiếp tục chạy tiếp** từ mức đang có sang câu kế; ô đó **đóng lại, khoá
  tạm** (không bấm mở lại được, hiện xám mờ) **cho đến khi có 1 ô KHÁC được trả lời đúng** (mọi ô đang bị
  khoá cùng lúc đó thì MỞ LẠI HẾT, không phải riêng ô vừa sai) — đã đọc kỹ câu trả lời của thầy để suy ra
  quy tắc "khoá theo NHÓM, mở theo đợt đúng kế tiếp" này (thầy không nói rõ 1-ô-hay-nhiều-ô, tự suy luận
  hợp lý nhất từ câu "không được chọn lại ô vừa sai cho đến khi có 1 ô đúng khác").
- Hết giờ (đồng hồ về 0, luôn xảy ra khi đang mở 1 câu) → **GAME OVER**: quay lại lưới ô → RUNG toàn bộ ô
  → NỔ tung từng ô (so le nhẹ) → bảng kết thúc **giống hệt bố cục "Game complete" của Quiz** (thầy gửi
  ảnh) nhưng đổi chữ thành **"GAME OVER"**, có Score + nút **Play again** (reset lại từ đầu, không thoát
  ra ngoài game).
- Trả lời đúng có **đếm điểm** (hiện ở góc trên phải, dùng lại `ui.setScore`).

**Quyết định kiến trúc quan trọng — KHÔNG gọi `ui.finish()`**: dù giờ Questions mode CÓ điểm + CÓ kết
thúc (khác hẳn lý do gốc "template không có finish" ở đầu file này), vẫn KHÔNG dùng `ui.finish()` của
engine vì 2 lý do: (1) dòng chữ "GAME COMPLETE" ở `core/engine.js` dòng ~591 đang **hard-code cứng**,
không có cách đổi thành "GAME OVER" mà không sửa `core/` (luật số 1 — KHÔNG session template nào tự sửa
core, và **lúc code đợt này có 1 phiên Claude KHÁC đang sửa `core/engine.js` cùng lúc thật** — đã hỏi
thầy xác nhận trước, xem `APP_MASTER.md`); (2) `ui.finish()` kéo theo TOÀN BỘ luồng nộp bài/leaderboard/
assignment của engine — không hợp với 1 mini-game "thua thì Play again" mang tính giải trí lớp học. Giải
pháp: **tự dựng bảng Game Over** bằng cách TÁI DÙNG các class CSS chung có sẵn trong `core/app.css`
(`.aw-backdrop`/`.aw-panel`/`.aw-panel-head`/`.aw-sum-stats`/`.aw-panel-items`/`.aw-panel-item` — đây là
class DÙNG CHUNG toàn app, không phải riêng Quiz, nên dùng thoải mái không tính là "sửa core"), y hệt
cách `core/engine.js` tự dựng bảng "GAME COMPLETE" — chỉ đổi chữ tiêu đề + nút. Không đụng 1 dòng nào
trong `core/`.
- **Màn chọn đáp án** cũng KHÔNG dùng lại `.aw-quiz-*` của `quiz.js` (class đó chỉ có trong `quiz.css`,
  mà trang chơi Open the box chỉ nạp CSS của chính nó — xem `test.html` — nên `.aw-quiz-tile` sẽ KHÔNG có
  style gì nếu dùng nhầm). Đã tự viết bộ class riêng `.aw-otb-q*` PHỎNG THEO đúng cấu trúc/hành vi của
  `quiz.js` (câu hỏi to trên cùng, ô đáp án 3D tô màu, dấu ✓/✗ bay lên dùng lại `.aw-mark-fly`/
  `.aw-tile-badge` — 2 class NÀY thật sự dùng chung trong `core/app.css`, an toàn khi tái dùng).
- **Đồng hồ = 1 thanh CSS `transition: width Xs linear`** (không phải vòng lặp `setInterval`) — mượt và
  nhẹ. Bắt sự kiện "hết giờ" bằng `setTimeout` cùng thời lượng (KHÔNG dùng `transitionend`) — đúng tinh
  thần "phải có phương án dự phòng khi tab ẩn" mà `CONG THUC MAU.md` yêu cầu cho `element.animate()`.
  Giây còn lại khi trả lời sớm được tính bằng `performance.now()` chứ không đoán từ CSS, để chuyển đúng
  số giây còn dư sang câu kế (trường hợp sai) hoặc reset đủ (trường hợp đúng).
- **Option mới**: "Question time" (giây, stepper 3–59, mặc định 15) qua `buildExtraOptions` — engine gọi
  hàm này sẵn có, không cần sửa `core/` (đúng cơ chế mở rộng Options đã có từ đợt Anagram).
- **Không đổi** `mode:"simple"` — vẫn y nguyên hành vi lật-xem cũ, KHÔNG điểm KHÔNG hẹn giờ (tách hẳn
  thành hàm `mountSimple` riêng, hàm `mountQuestions` mới hoàn toàn lo phần tương tác trên).
- **Test qua `test.html`** (dữ liệu mẫu tạm 6 câu, đã trả về 9 câu Speaking gốc sau khi xong): xác nhận
  đúng cả 5 luật ở trên bằng browser thật — trả lời đúng giữ mở + tích xanh thấp, trả lời sai khoá xám +
  quay lưới, trả lời đúng Ô KHÁC thì ô đang khoá tự mở lại, hết giờ tự rung→nổ→bảng GAME OVER đúng
  Score/6 + Play again, đổi Style→Basic thì cả lưới ô VÀ 3-4 ô đáp án đều tự đồng nhất về navy đúng luật
  theme (dùng lại đúng chuỗi `var(--aw-tile-fixed, var(--otb-c,...)))` như quiz.js). `grep
  "transform:.*translate|animation:"` xác nhận không dính bẫy mục 3.5 (phần tử duy nhất định vị bằng
  transform — dấu tích xanh thấp — không có animation riêng). 0 lỗi console suốt quá trình.
- **Chưa làm / có thể hỏi thêm sau nếu thầy cần**: chưa có màn "thắng" riêng khi mở hết TẤT CẢ ô đúng
  trước khi hết giờ (hiện chỉ `ui.toast("All boxes opened!")` nhẹ nhàng — thầy không yêu cầu màn thắng
  nên chưa tự vẽ thêm, tránh làm dư việc); `options.boxesAutoClose` không áp dụng cho Questions mode nữa
  (chỉ còn ý nghĩa ở Simple mode).

### 29/7/2026 (đợt 2) — đổi sang nền TÔ ĐẶC màu kiểu ô đáp án Quiz (thầy gửi thêm ảnh 40 ô + ảnh Quiz)
- Sau đợt 1 (trắng + viền màu, xem log dưới), thầy gửi thêm 1 ảnh 40 ô THẬT (tô đặc màu, không viền
  trắng) + 1 ảnh CHÍNH Quiz của app (để chỉ rõ "nền ô" mong muốn = giống hệt ô đáp án Quiz).
- **`open-the-box.js`**: đổi `PALETTE` từ 5 màu tự chọn sang **ĐÚNG 8 màu của `quiz.js`** (blue/cyan/
  emerald/amber/orange/red/teal/violet) — đồng bộ màu thương hiệu 100% với Quiz, xoay theo cột như cũ.
  Thêm `--num-size` tính TỪ CỠ Ô THẬT (`size * 0.46`, đơn vị px) thay vì cqw cố định theo bề rộng khung —
  lý do: cỡ ô giờ thay đổi theo số lượng hộp (đợt 1), nếu số vẫn cqw cố định thì lưới ít hộp (ô to) số sẽ
  nhỏ xíu, lưới nhiều hộp (ô nhỏ) số sẽ tràn — phải tính theo cỡ Ô THẬT mới đúng ý "to hết mức cân đối".
- **`open-the-box.css`**: `.aw-otb-face-front` đổi hẳn sang mẫu y hệt `.aw-quiz-tile` — nền TÔ ĐẶC màu
  (`background: var(--tile-eff)`) + bóng đổ "lip" đáy 3D (`var(--aw-tile-shadow, ...)`) + chữ trắng đậm,
  bỏ viền trắng + góc gấp giấy của đợt 1 (ảnh mới không có góc gấp). Vẫn giữ chuỗi fallback
  `var(--aw-tile-fixed, var(--otb-c,...))` nên theme Basic vẫn ép 1 màu đúng như trước.
- **Test qua `test.html`**: 9 ô + thử tạm 40 ô — khớp gần như y hệt ảnh 40 ô thầy gửi, số 2 chữ số vẫn
  to rõ không tràn; trả sample về 9 câu gốc sau khi test. 0 lỗi console.
- **CHƯA làm** (việc lớn thầy yêu cầu thêm, đang hỏi thầy rõ phạm vi trước khi code — xem mục "ĐỀ XUẤT
  SỬA CORE" và phần hỏi thầy bên dưới): bấm mở 1 ô → hiện màn CHỌN ĐÁP ÁN kiểu Quiz (câu hỏi + A-D) thay
  vì chỉ hiện chữ; 1 thanh thời gian CHUNG chạy lùi suốt ván (không phải mỗi câu 1 đồng hồ riêng như
  Quiz) — đúng thì reset về đầy, sai thì tiếp tục chạy, về 0 thì Game Over. Đây là thay đổi LỚN: hiện
  Open the box CHỦ ĐÍCH không điểm/không kết thúc (`scorable:false`, không gọi `ui.finish()`) — nếu làm
  đúng ý thầy thì chế độ "Questions" sẽ CẦN điểm + màn kết thúc, khác hẳn thiết kế gốc. Phải thầy chốt
  rõ hành vi rồi mới code (đúng quy tắc "tính năng lớn: nghiên cứu + báo trước, chờ ok build").

### 29/7/2026 (đợt 1) — sửa hình dạng ô theo ảnh mẫu thật của Wordwall (thầy gửi ảnh 50 ô)
- Thầy gửi ảnh chụp màn Open the box thật (wordwall.net): 50 ô hình VUÔNG, viền màu xoay theo cột
  (cam→vàng→xanh lá→xanh dương→tím→lặp lại), góc dưới-phải có nếp gấp giấy nhỏ, luôn canh giữa khung.
- **`open-the-box.js`**: thêm `bestFit(w,h,gap,n)` — tự tìm số cột/kích cỡ ô để N ô VUÔNG lấp đầy vùng
  lưới lớn nhất có thể (bài toán 2D mà CSS Grid thuần không tự giải được vì bề rộng cột và chiều cao
  hàng độc lập nhau). Gọi lại mỗi lần `render()` + qua `ResizeObserver` gắn vào `root` (bắt cả lúc bật
  fullscreen). Thêm `PALETTE` 5 màu (cam/vàng/xanh lá/xanh dương/tím — CÙNG mã màu quiz.js đã dùng cho
  bộ 8 màu của nó, giữ đồng bộ màu thương hiệu) + `colorBoxes()` gán màu viền theo `(cột % 5)`.
- **`open-the-box.css`**: `.aw-otb-grid` đổi sang `repeat(var(--cols), var(--cell))` (2 biến JS tính ra)
  thay `auto-fill/minmax` cũ; mặt trước ô đổi nền trắng + viền màu (`--otb-c`/`--otb-d` set trong JS) qua
  chuỗi fallback `var(--aw-tile-fixed, var(--otb-c, ...))` — **giống hệt cách quiz.js đã làm** nên theme
  Basic (ép mọi ô 1 màu) vẫn ăn đúng, đã test đổi Style→Basic xác nhận toàn bộ viền về navy đồng nhất.
  Thêm góc gấp giấy nhỏ (`::after` tam giác xám nhạt góc dưới-phải).
- **Test qua `test.html` (browser thật)**: 9 ô mẫu đúng như ảnh (5+4, canh giữa); đổi tạm dữ liệu mẫu
  lên 50 ô để so ảnh — ra ĐÚNG bố cục 10×5 giống ảnh thầy gửi, màu lặp đúng chu kỳ 5 cột, không tràn
  khung; bấm mở ô lật 3D + hiện nội dung bình thường; đổi Style Classic→Basic màu viền tự đồng nhất;
  0 lỗi console. Đã trả sample về đúng 9 câu speaking prompts ban đầu sau khi test xong.
- Chưa đổi: cách khoanh vùng lưới (topbar/nav) — thầy chỉ yêu cầu sửa HÌNH DẠNG Ô, chưa đụng phần khác.

### 24/7/2026 — build xong, GIẢI ĐƯỢC bài toán "engine luôn chạy finish→leaderboard" mà KHÔNG sửa core/
- `open-the-box.js`/`.css`/`sample-open-the-box.js` tạo mới, `type: "open_the_box"`, **`scorable: false`**.
- **Cách giải quyết lưu ý ở đầu file này**: template này **KHÔNG BAO GIỜ gọi `ui.finish()`** — vì thế
  không bao giờ kích hoạt celebration/"Game complete"/leaderboard (đúng bản chất game mở, không có
  "kết thúc"). Cũng **KHÔNG đăng ký `ui.onSubmit()`** → menu "Submit answers" tự trở thành vô hại
  (`submitHandler?.()` trong engine.js đã tự bọc optional-chaining sẵn). `options.timer: "none"` trong
  dữ liệu mẫu → engine KHÔNG chạy đồng hồ (đọc code engine.js xác nhận: timer chỉ start khi
  `timerMode() !== "none"`), nên không cần tự `stopTimer()`. Hoàn toàn không đụng `core/`.
- **Giao diện**: lưới hộp đánh số 1..N (CSS Grid, không phải Flex-transform-center) → bấm hộp LẬT 3D
  (CSS `transform:rotateY` trên chính khối hộp, KHÔNG phải để định vị-căn-giữa → không dính bẫy mục 3.5
  của CONG THUC MAU.md dù có dùng transform). Mặt sau hiện nội dung: **mode "simple"** = 1 dòng prompt;
  **mode "questions"** = câu hỏi + danh sách đáp án, đáp án đúng có dấu ✓ xanh (đã test cả 2 mode).
- `options.boxesAutoClose` (true = chỉ 1 hộp mở tại 1 thời điểm, mở hộp mới tự đóng hộp cũ; false/mặc
  định = nhiều hộp mở đồng thời, bấm lại 1 hộp đang mở để đóng riêng nó) — đã test cả 2 chế độ, đúng
  như mô tả docs mục 3 "BOXES: Leave open / Automatically close".
- Điểm/thanh tiến độ (`ui.setScore`/`ui.setNav`) được **DÙNG LẠI làm bộ đếm "đã mở bao nhiêu hộp"**
  (không phải điểm thật — engine chưa có UI riêng cho game không điểm) — số đếm này KHÔNG giảm khi đóng
  lại 1 hộp đã từng mở (đúng ý "tiến độ đã khám phá", không phải "đang mở").
- **Test qua `test.html` (browser thật)**: mở/đóng hộp mượt, mở nhiều hộp cùng lúc, bật thử
  `boxesAutoClose:true` → chỉ 1 hộp mở tại 1 thời điểm (đã trả về `false` sau khi test); thử mode
  "questions" với 1 câu hỏi có 2 đáp án → hiện đúng ✓ xanh cho đáp án đúng (đã trả về mode "simple" +
  9 prompt nói mẫu sau khi test). 0 lỗi console suốt quá trình. Không có Timer/Lives/Marking hiện trên
  màn hình — đúng docs mục 3 ("Không có Timer/Lives/Marking vì không chấm điểm").
- Chưa làm: **ROWS** riêng (docs có cả cột lẫn hàng, mới làm `options.columns`; số hàng luôn tự tính
  theo CSS Grid auto-flow) — không phải bug, chỉ chưa tách riêng điều khiển hàng vì Grid tự chia đều đã
  đủ đẹp cho hầu hết trường hợp. **END OF GAME: Show answers** (docs mục 3) không áp dụng được vì
  template không có khái niệm "kết thúc" (không gọi finish) — bỏ qua có chủ đích, không phải thiếu sót.

## ĐỀ XUẤT SỬA CORE (nếu có)
Nếu sau này AWord có NHIỀU game mở (open-ended) khác (Speaking cards, Flash cards, Spin the wheel...),
nên cân nhắc thêm 1 nhánh UI trong `core/engine.js` đọc cờ `scorable:false` để: (a) ẩn hẳn icon
✓+số ở topbar thay vì các template phải tự "mượn" nó làm bộ đếm tiến độ như file này đang làm, (b) có
thể thêm 1 nút "Reset boxes"/"Close all" chuẩn trong thanh dưới khung thay vì chỉ có "Start again" (vốn
dựng lại toàn bộ activity, hơi nặng cho nhu cầu "đóng hết hộp lại" đơn giản). Chưa cấp thiết — 4/4 game
hiện tại vẫn chạy tốt với engine như hiện có, ghi lại để cân nhắc khi có thêm game mở thứ 2.
