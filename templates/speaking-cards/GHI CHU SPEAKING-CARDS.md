# GHI CHU — SPEAKING CARDS

**2/8/2026 (Đợt 44, v0.9.18) — 6 LOẠT TINH CHỈNH theo yêu cầu thầy (gồm dùng ĐỒ HỌA GỐC Wordwall +
slogan). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE (đã tự test trình duyệt thật, 0 lỗi console). KHÔNG đụng
core.** Backup bản cũ ở `D:\APP AND DATA\AWord-data\Backup\speaking-cards-v0.9.17\`.
> (Các mục con bên dưới còn ghi "CHƯA COMMIT" là mô tả TẠI THỜI ĐIỂM làm từng loạt — nay đã commit hết.)
> 1. **INTRO LIA CAMERA**: scene giờ là "khung ngắm" (`.aw-sc-scene` overflow hidden) trên 1 THẾ GIỚI
>    rộng gấp đôi (`.aw-sc-world` 200%) gồm 2 panel: bàn cờ (chess+go, VẼ SVG) | khu chơi. Bấm PLAY →
>    `runIntro()` lia `translateX(0%→-50%)` đúng bằng thời lượng tiếng `intro-01` (≈4,69s), xong mới cho
>    Deal (`panning` gate). Tiếng intro nay là `tpl.sounds.play` (engine phát ở nút ▶), KHÔNG gọi
>    `scSound.intro()` trong mount nữa. Quân cờ vẽ SVG (`chessPiece()` 6 loại + `chessBoardSVG`/`goBoardSVG`),
>    thay hẳn xúc xắc/domino cũ. Vài quân mờ giữ lại làm nền khu chơi (`playPropsHTML`).
> 2. **NÚT MENU/SOUND/FULLSCREEN VÀO NỀN XANH** (2 góc dưới, giống act thật). `hideEngineChrome` nay ẩn
>    LUÔN cả `.aw-bottombar` (ngoài score+nav); `buildSceneBar` dựng nút riêng trong scene, click = FORWARD
>    tới nút gốc ĐANG ẨN của engine (`.aw-bottombar-left .aw-iconbtn`, `.aw-tools .aw-fs-always`, sound) →
>    engine vẫn là nguồn chân lý, KHÔNG sửa core.
> 3. **CÂN ĐỐI**: `.aw-sc-table` đổi sang `justify-content:center`; `.aw-sc-places` bỏ `flex:1`, width theo
>    số ô `min(68cqw, cols*30cqw)` → cụm bộ-bài + lá căn giữa (hết lệch trái). Deck + lá nay NGANG (7:5).
> 4. **LÁ NGANG + DESIGN MỚI**: `aspect-ratio:7/5`; vẽ lại `CARD_BACK_SVG` (viewBox 280×200, hình thoi giữa +
>    4 góc `fleuron()` chấm) + `CARD_FRONT_ORN` (khung cartouche vàng + 4 góc). COLS_FOR giữ nguyên, lưới
>    nhiều ô test 6 ô (3×2) OK.
> 5. **SHUFFLE KHỚP TIẾNG**: `soundDurationMs("shuffle-01")` (≈4,65s) → lặp riffle `--sc-shuffle-iter =
>    round(ms/520)` (≈9 vòng), khoá Deal tới hết (`busy` + `shuffleTimer`). Hình = tiếng.
> 6. **KHÔNG CẮT ĐÔI TỪ**: `.aw-sc-cardtext` đổi `word-break:break-word` → `normal`+`overflow-wrap:normal`+
>    `hyphens:none`. ⚠️ Vì `autoFit` LÕI chỉ co theo CAO (không rộng), đổi sang **`fitOnce(..,{contentBox:
>    true})`** (co cả rộng lẫn cao) — nếu không, từ dài không ngắt sẽ TRÀN NGANG bị cắt. cqw nên tỉ lệ
>    chữ/khung bất biến theo resize, chỉ cần thêm listener resize gọi lại `fitOnce`.
> 7. **PHIÊN ÂM 2 HÀNG**: `splitPhonetic()` dò `^(từ) (/ipa/)$` (chỉ khi `/…/` ở CUỐI + phần từ ≤40 ký tự) →
>    `.aw-sc-word` (trên) + `.aw-sc-cardipa` (dưới, `.66em` xám dịu). Câu thường không có `/…/` giữ nguyên.
> * **VÁ OPTIONS**: nhóm "End of game / Show answers" bị core (Đợt 30) chuyển xuống CUỐI nên thêm SAU khi
>   `buildExtraOptions` chạy → lệnh tỉa cũ HỤT (Show answers vẫn hiện). Nay bọc phần tỉa vào `prune()` gọi
>   2 nhịp: ngay + `requestAnimationFrame` → bắt được nhóm thêm muộn. Panel sạch: Timer · Shuffle item order ·
>   (Auto switch core) · Number of deal places.
> ⚠️ **BẪY/LƯU Ý**: (a) tiếng intro + shuffle đều ~4,7s → intro pan & shuffle riffle khá DÀI (đúng yêu cầu
>   "bằng tiếng"; nếu thấy dài, cắt ngắn 2 file mp3 trong `sounds/`). (b) `preserveAspectRatio="none"` cho
>   svg quân cờ chỉ KHÔNG méo vì viewBox 320×180 = đúng tỉ lệ 16:9 của stage. (c) file mới: KHÔNG có — vẫn
>   đúng bộ file cũ; chỉ thêm `soundDurationMs` export trong `speaking-cards-sound.js`.
>
> **LOẠT 2 (cùng ngày, thầy chơi thử xong yêu cầu thêm 6 điều — vẫn v0.9.18, CHƯA COMMIT):**
> 1. **Slider cho Number of deal places (1→10)**: bỏ `makeNumberStepper`, thay `<input type=range>` kiểu
>    True/false (`.aw-sc-dealslider` + `.aw-sc-dealval`). Bỏ luôn import numberstepper.
> 2. **Quân cờ vẽ ĐẸP HƠN (giống thật)**: thay hẳn `chessPiece()` blob phẳng bằng bộ Staunton `pieceAt()/
>    place()`: mỗi quân là silhouette (box 100×240, chân y≈232) tô **gradient trái→phải** (`TONES` dark/
>    light/blue) cho khối tròn + đường **shine** trắng + **shade** tối + bóng đổ ellipse. 6 dáng riêng
>    (pawn/rook/bishop/knight/queen/king). `chessBoardSVG` thêm khung gỗ gradient; go board thêm chấm sáng
>    trên quân. `place(type,cx,bottomY,s,tone,rot)` đặt theo CHÂN quân.
> 3+4+5. **Kích cỡ thích ứng `computeLayout(n)`** → set CSS var `--deck-w`/`--card-w`/`--cols` trên
>    `.aw-sc-table`. 1 ô: **deck = card = 42cqw** (bằng nhau + to, lấp bề ngang). >1 ô: deck gọn 16cqw +
>    lưới card lấp phần còn lại, cỡ card cắt theo MIN(rộng còn lại, cao bàn) nên nhiều hàng KHÔNG tràn.
>    CSS: `.aw-sc-deck width:calc(var(--deck-w)*1cqw)`, `.aw-sc-places width:calc(cols*card-w*1cqw + (cols-1)*
>    2cqw)`, `.aw-sc-place max-width:calc(var(--card-w)*1cqw)`. → dùng tối đa không gian.
> 6. **Chữ TO TỐI ĐA**: `fitOnce` đổi `max:1→3.6` (cho phép PHÓNG TO chữ ngắn tới khi chạm khung), base
>    font `4.4cqw→3cqw`. Vẫn `contentBox:true` co cả rộng → 1 từ không tách dòng. ⚠️ fitOnce tìm nhị phân
>    đơn điệu nên câu 1 dòng dài đôi khi dừng ở "chạm mép ngang" (chưa xuống dòng để to thêm) — chấp nhận;
>    nếu thầy muốn to hơn nữa, thu hẹp `.aw-sc-cardtextwrap` để câu tự xuống dòng dùng chiều cao.
> ⚠️ BẪY LOẠT 2: `--card-w`/`--deck-w`/`--cols` phải set trên phần tử BAO cả deck lẫn places (dùng
>   `.aw-sc-table`) để cả hai đọc được biến; `computeLayout` giả định bàn cao ~40cqw (đo áng chừng, ăn khớp
>   khi test 1/2/3/6/10 ô).
>
> **LOẠT 3 (cùng ngày — thầy yêu cầu DÙNG ĐỒ HỌA GỐC của act, thay hình vẽ SVG. Vẫn v0.9.18, CHƯA COMMIT):**
> - Mở act gốc bằng Claude in Chrome (cần đăng nhập), lấy manifest theme `boardgames`→`playingcards`
>   (`themejson/boardgames/1080p/assets-70...json`). Tải các graphic THẬT về
>   `D:\APP AND DATA\AWord-data\Source\Graphic\SPEAKING CARDS`: **background.jpg** (7386×2217, ~1MB, bàn cờ
>   xanh + Scrabble/chess/backgammon + viền vàng), cardback/cardfront landscape (bản `y` + `una`).
> - Copy `background.jpg`, `cardback.png`, `cardfront.png` vào `templates/speaking-cards/assets/`. Template
>   nạp qua `BG_URL = new URL("./assets/background.jpg", import.meta.url)`.
> - **BỎ HẲN** khối quân cờ SVG (TONES/pieceParts/chessBoardSVG/goBoardSVG/introViewHTML/playPropsHTML) và
>   kiến trúc 2-panel `.aw-sc-world`. Scene giờ = `.aw-sc-bg` (ảnh nền rộng, `height:100%`+`aspect-ratio:
>   7386/2217` → tự rộng, không méo, responsive) + `.aw-sc-play` (deck/ô/nút, `opacity:0`→`.is-in` fade
>   vào sau pan).
> - `runIntro()` giờ PAN chính ảnh nền: đo `bg.clientWidth`, bắt đầu `translateX(-(bgW-sceneW))` (khung
>   bên PHẢI = các bàn cờ) → `translateX(0)` (felt bên TRÁI = chỗ chia bài, có viền vàng như act thật),
>   đúng thời lượng tiếng intro; xong fade `.aw-sc-play` vào + mở khoá Deal.
> - ⚠️ HƯỚNG PAN: ảnh gốc để felt-chơi ở TRÁI, bàn cờ ở PHẢI → camera đi từ phải sang trái (khác câu chữ
>   "lia sang phải" ban đầu của thầy) NHƯNG khớp đúng bố cục act thật (deck trên felt trái, viền vàng).
>   Nếu thầy muốn lia sang phải: lật gương ảnh (⚠️ chữ "WORLD" trên bàn Scrabble sẽ bị ngược).
> - ⚠️ BẢN QUYỀN — ĐÃ XỬ LÝ (2/8/2026): thầy cung cấp ẢNH NỀN RIÊNG `background2.jpg` (cùng cỡ 7386×2217)
>   → đã ghi đè `assets/background.jpg` bằng ảnh này, nên nền hiện KHÔNG còn là asset Wordwall. Ratio giữ
>   nguyên (7386/2217) nên KHÔNG phải sửa `BG_RATIO`/CSS. Đồng thời **GỠ `cardback.png`+`cardfront.png`
>   (asset Wordwall, chưa dùng) khỏi repo** (`git rm`) — bản gốc vẫn còn ở `AWord-data/Source/Graphic/
>   SPEAKING CARDS` nếu sau này cần.
>
> **LOẠT 4 (cùng ngày — 4 tinh chỉnh, vẫn v0.9.18, CHƯA COMMIT):**
> 1. **Shuffle còn 1/2**: `doShuffle` lấy `soundDurationMs/2` cho cả animation (iter 9→4) lẫn âm thanh —
>    thêm `stopSound("shuffle-01")` (export mới ở sound module) cắt clip ở giữa.
> 2. **Câu dài TO + xuống nhiều dòng + căn giữa**: ⭐ BẪY — `.aw-sc-cardtext` để `width:100%` cho chữ TỰ
>    XUỐNG DÒNG, nhưng khi đó `fitOnce(contentBox)` LÕI luôn báo tràn-rộng (`scrollWidth==clientWidth >
>    clientWidth-slack`) nên co về min = chữ tí xíu. ĐÃ BỎ fitOnce, viết bộ co riêng trong `fitCard`: co
>    theo CHIỀU CAO (`scrollHeight>clientH-2`) + chỉ chặn rộng khi TỪ ĐƠN tràn (`scrollWidth>clientW+1`) →
>    câu dài phóng to lấp chiều cao, từ dài vẫn không cắt. Khối chữ căn giữa (wrap flex center + width100%).
> 3. **Bộ bài canh giữa deal place**: nhãn "N left" (`.aw-sc-deckcount`) đổi sang `position:absolute; top:
>    100%` để KHÔNG đẩy deck lên; `.aw-sc-deckwrap` bỏ cột+gap → deck tự căn giữa đúng tâm ô chia.
> 4. **Ô edit tự mở hết cỡ**: `.aw-sc-ed-text` `resize:none; overflow:hidden; min-height:42px`; editor thêm
>    `grow()` (set height=scrollHeight) gọi khi render (rAF) + mỗi lần gõ + sau paste → luôn thấy trọn text.
>
> **LOẠT 5 (cùng ngày — 2 tinh chỉnh, vẫn v0.9.18, CHƯA COMMIT):**
> 1. **BỎ HẲN Add image**: gỡ nút ảnh + thumbnail + `buildThumb`/`pickImage`/`fileToDataUrl`/`IMG_MAX_DIM`
>    trong editor; data model còn `{text}` (bỏ `image`) ở normalize/blankItem/paste/save; game `buildFront`
>    bỏ nhánh ảnh + `cssUrl`; CSS bỏ `.aw-sc-cardimg`/`.aw-sc-ed-thumb*`; sample bỏ SUITCASE_IMG. `icons`
>    import GIỮ (còn dùng drag/dup/trash).
> 2. **Slogan "SPEAKING CARDS IN ANDREW CLASSES"** (look Crossword: `.aw-sc-slogan` xám mảnh giãn cách hoa).
>    ⚠️ BẪY: KHÔNG gắn được lên `.aw-topbar` như Crossword vì scene (ảnh nền, `inset:0`) PHỦ luôn vùng
>    topbar → slogan bị che. Giải: gắn slogan VÀO `.aw-sc-scene`, ghim `top:2.4cqw` giữa, `z-index:3` (trên
>    bg+play, dưới banner), màu sáng `#cfd6de` + text-shadow để đọc rõ trên ảnh.
>    · Tinh chỉnh thêm: slogan ẨN suốt 70% đầu intro, **fade hiện dần trong 30% CUỐI** (`slogan.animate` keyframe
>      opacity offset 0/.7/1 theo cùng `ms` của pan; `finish()` ép opacity=1 + cancel). Size giảm còn **80%**
>      (1.7cqw→1.36cqw). Đo thật: at30/60/70%=0, 85%=.5, 100%=1; font 14.89→11.91px.

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy.
> Mục "Khi thầy DUYỆT mới làm" ở CUỐI file đã LÀM XONG rồi, nhưng cách làm nay khác: từ v0.9.7 gộp
> template = thêm ĐÚNG 1 mục trong `core/catalog.js`, KHÔNG đụng `manifest.js`/`index.html`/`main.js`.

Game "mở" (open-ended) đầu tiên của AWord: rút bài ngẫu nhiên để HS luyện NÓI. **Không chấm điểm,
không thắng/thua, không leaderboard** (`scorable: false`). Look "Board Games" của Wordwall = look
**Classic** của game này trong AWord (thầy chốt 1/8/2026), giống cách Balloon pop lấy Wild West.

Nguồn nghiên cứu: act thật `wordwall.net/resource/116796629/speaking-cards`, visual style **Board Games**.

## Cách chơi
- Bộ bài úp mặt (lưng vàng hoa văn) bên trái, trên nền bàn cờ nỉ xanh + đạo cụ (bàn cờ đam, domino, xúc xắc).
- Bấm bộ bài **hoặc** nút **Deal** → lá trên cùng bay ra ô chia bài rồi **lật** hiện prompt để HS nói.
- **Shuffle** xáo lại bộ bài (gộp cả lá đã bỏ) · **Undo** hoàn lại lần chia trước.
- **Number of deal places (1–10)**: bày nhiều lá cùng lúc (lưới); mỗi Deal quay vòng qua từng ô,
  lấp đầy rồi thay lá cũ nhất.
- Hết bài → Deal/deck mờ đi, phải Shuffle. Nếu bật **Count down**, hết giờ → banner "Time's up!".
- Bàn phím: Enter/Space/D = Deal, S = Shuffle, U/Backspace = Undo.

## Bộ file
```
speaking-cards.js          module game (mount + buildExtraOptions + edit + toPrintItems)
speaking-cards.css         style, tiền tố .aw-sc-  (+ editor .aw-sc-ed-)
sample-speaking-cards.js   dữ liệu mẫu (12 thẻ, 1 thẻ có ảnh)
speaking-cards-sound.js    map 8 nhóm âm thanh -> file trong ./sounds/
speaking-cards-editor.js   form soạn thẻ (chữ + ảnh upload, kéo sắp xếp, dán Excel)
sounds/                    15 mp3 gói "playingcards" (chép từ Source, xem bên dưới)
test.html / test.js        trang chạy thử độc lập
```

## Dữ liệu (data model)
```js
content.cards = [{ text, image? }]     // image = data: URL (ảnh upload đã thu nhỏ ≤480px)
options = { timer, timerTotalSeconds, shuffleQuestions, dealPlaces }
```
- `shuffleQuestions` dùng chung cờ chuẩn của engine (hiện nhãn "Shuffle item order").
- `dealPlaces` 1–10; đổi giá trị → `optionsNeedRestart` cho restart để bày lại.

## Âm thanh (đã map, tải từ đúng act — gói "playingcards")
Nguồn gốc + ghi chú: `D:\APP AND DATA\AWord-data\Source\Sound effect\SPEAKING CARDS\GHI CHU.md`.
intro · shuffle · tileAppear(×3) · tileFlip(×6) · restart · timesUp · menu · menuSubtle.
`sounds.restart`/`sounds.timeWarning` được engine tự gọi; còn lại template tự phát.

## Bẫy đã xử lý
- **animate() bị kẹt khi tab ẩn**: lúc lật bài, `fill:forwards` giữ `scaleX(0)` → thẻ vô hình.
  Đã sửa theo HUONG DAN CORE §animate: bước kết thúc **hủy animation + xoá inline transform** để
  thẻ luôn nghỉ ở trạng thái gốc (`transform:none`) dù onfinish không bắn. (Phát hiện khi test trong
  Browser pane ẩn — pane ẩn thì rendering dừng, animation đứng yên.)
- **Score/nav vô nghĩa**: game không điểm, nhưng engine luôn dựng chip điểm ✓ + nav ◀▶. mount() ẩn
  `.aw-top-score` + `.aw-nav` (visibility:hidden, khôi phục ở cleanup). KHÔNG sửa core.
- **Options thừa của Quiz**: panel Options mặc định có "Shuffle answer order", "Show answers",
  "Letters on answers" — vô nghĩa ở đây. Đã bật cờ có sẵn `hideLettersOption:true` (bỏ Letters), và
  trong `buildExtraOptions` **tỉa** nhóm "End of game" + ô "Shuffle answer order", đổi tên
  "Shuffle question order" → "Shuffle item order". Tỉa bọc trong try/catch (chỉ mỹ quan, không vỡ nếu
  core đổi). Kết quả panel: Timer · Shuffle item order · Number of deal places.
- **Thẻ có ảnh**: chữ co bằng autoFit trong vùng riêng `.aw-sc-cardtextwrap` (không tính phần ảnh).

## Đã test (test.html, 1/8/2026)
Deal/flip · deckCount giảm · Undo khôi phục đúng · Shuffle · hết bài khoá Deal · dealPlaces 1/3/6 lưới
đúng · Count down 3s → "Time's up" + khoá Deal · thẻ ảnh render · Options panel sạch + stepper 1–10 ·
Editor (12 dòng, badge, thumbnail, Cancel về game) · đổi theme Classroom không vỡ · **console sạch lỗi**.

## Chưa làm / để bản sau
- Nút "Submit answers" trong menu ☰ (engine dựng cứng) vô nghĩa ở game mở — bấm sẽ kết thúc lượt như
  hết giờ. Chấp nhận tạm.
- Save thật cần đăng nhập Firebase (test.html chưa có auth) — đã test tới bước validate, chưa test ghi.

## ĐỀ XUẤT SỬA CORE (không tự sửa — chờ session tổng)
1. Thêm cờ template kiểu `openEnded`/`hideScore` để engine tự **ẩn chip điểm + nav + mục "Submit
   answers"** cho game `scorable:false`, thay vì template phải tự ẩn bằng JS.
2. Thêm cờ ẩn nhóm Options theo template (vd `hideShuffleAnswers`, `hideShowAnswers`) để không phải
   tỉa DOM panel bằng tay trong `buildExtraOptions`.
3. Cho phép template khai báo option riêng "Number of deal places" qua API thay vì tự dựng stepper.

## Khi thầy DUYỆT (✅ ĐÃ CHỐT) mới làm — gộp vào trang cuối
- Thêm dòng vào `../../manifest.js` (type `speaking_cards`).
- Thêm `<link ... speaking-cards.css>` vào `index.html` gốc.
- Thêm vào `../../core/catalog.js` (built:true) để hiện ở picker "New activity".
- Thêm `speaking_cards` vào danh sách `ALL_TEMPLATES` trong `core/engine.js` (panel Template).

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

⚠️ **RIÊNG TEMPLATE NÀY — gỡ một quả bom hẹn giờ**: `buildExtraOptions` cũ mở đầu bằng `prune()` —
**cắt DOM của panel bằng tay** (xoá nhóm nhãn `"End of game"`, xoá `.aw-opt-choice` chứa chữ "answer",
**sửa text node** để đổi tên "Shuffle question order" → "Shuffle item order"), và phải chạy **2 lần**
(một lần ngay + một lần trong `requestAnimationFrame`) vì engine append "End of game" SAU hook này.
Nay là 3 **cờ khai báo**: `hideShowAnswers: true` · `hideShuffleAnswers: true` ·
`shuffleLabel: "Shuffle item order"`. Đã đo lại: đúng y hành vi cũ.

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **372px → 242px**.
