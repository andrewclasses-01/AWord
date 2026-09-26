# GHI CHÚ WORDSHAKE — template #21 + game cố định trong GAMES

## ⭐ Đợt 402 (26/9/2026) — TEMPLATE: hết giờ giống GAME (Đợt 401 + đếm Đợt 395)
- `slideDown(box, target, scale)` (tâm→tâm, hệ số px lấy từ ĐÍCH vì ô tank bị skew) + `countTanks(tanks, scores, grow)`
  (phép đếm GAME Đợt 395) — thay `drainTanks` (đã xoá).
- Fight `fightReveal`: `.aw-fight.is-ws-ending` (playarea 2 bàn tối + blur), 2 `.aw-fight-team` → giữa `.aw-fight-board`
  (×≤1,5, đội dẫn `is-ws-big` ×1,2), đếm nếu Score tank bật; bảng kết quả core bê vào `.aw-fight-shared` bằng
  MutationObserver (`is-ws-mid`, nền neon). Show answers vẫn toàn màn. Start again dựng lại trận.
- Chơi đơn `finish()`: `.aw-stage.is-ws-ending` (topbar `overflow:visible` + z 6), `.aw-ws-toptank` → giữa `.aw-playarea` ×2,
  đếm, rồi `ui.finish` như cũ (ô gỡ, GAME COMPLETE).
- Đã đo test.html (Fight Mode 3 + đơn Mode 2): đúng, 0 lỗi. ⬜ TOMKO.

## ⭐ Đợt 401 (26/9/2026) — GAME: hết giờ ⇒ bàn tối + mờ, ô điểm xuống giữa bàn đội rồi mới đếm
- Chỉ `games/wordshake/` (template Fight không đổi). `finish()` vẽ pha `count` rồi 2 khung hình sau mới bật `G.down` ⇒ root
  `.ending` (con của 2 bàn đội `brightness(.35) saturate(.6) blur(4px)`) + ô `.wsg-score.down` (`translateY(232px) scale(1.4)`,
  z 4, .8 s); đội dẫn `.down.big` scale 1.7. Đếm bắt đầu ở 1400 ms (cũ 900). `render()` giữ `down`/`ending` theo `G.down` nên
  màn kết quả để ô ở giữa bàn; `newBoard()`/`toReady()` đặt lại `G.down=false` ⇒ PLAY AGAIN/Home như cũ.
- Đã đo test.html (đồng hồ tua nhanh): trượt + mờ đúng, 22|7 ở giữa bàn trên màn kết quả, PLAY AGAIN sáng lại, 0 lỗi. ⬜ TOMKO.

## ⭐ Đợt 390b (25/9/2026) — thầy chê bình nước bản đầu "xấu quá" ⇒ 5 mẫu, thầy chọn MẪU 4 + mức CỐ ĐỊNH
- Trang chọn mẫu: `D:\OTHERS\CLAUDE\AWord - thiet ke Wordshake\score-tank-mau.html` (5 mẫu canvas đúng cỡ ô 220×40, tự chạy
  ghi điểm → cạn + đếm; xem bằng server `ws-tank-mau` trong `D:\OTHERS\CLAUDE\.claude\launch.json`, cổng 5596).
  1 Mặt nước êm/giọt · 2 Sóng vật lý lò xo/rơi thẳng · 3 Bọt sủi/bong bóng · **4 Năng lượng neon/sao chổi** · 5 Tối giản/tia sáng.
- Thầy chọn **mẫu 4**, thêm luật: **mức năng lượng LUÔN NGANG NHAU** ("không đoán được đội nào hơn cho đến khi chạy điểm").
- `ws-lib.js`: thay trọn phần bình (CSS cũ sóng mask/bọt/vệt sáng bỏ hết) bằng canvas: dải sáng chạy ngang, scanline, vạch neon
  trắng rung nhẹ trên mặt; `hit()` = xung sáng quét hai phía + 10 tia lửa, **mực KHÔNG đổi** (`FIXED = .62` cho mọi đội mọi
  điểm; `set()` rỗng; `tankLevel()` trả `FIXED` cho người gọi cũ; tham số `k` bị bỏ qua). `flyPoint` = sao chổi đầu trắng + 5
  bóng đuôi trễ 28 ms, vòng cung 480 ms. Một vòng rAF chung (`LIVE`), canvas tự đo lại khi đổi cỡ; `drain` vẫn setInterval.
  API giữ nguyên ⇒ GAME + template không đổi dòng logic nào (chỉ sửa chú thích).
- Đã đo: GAME đội trái 3 từ / đội phải 0 ⇒ hai canvas cùng tỉ lệ tô 0,67; sao chổi 1 đầu + đuôi; template đơn giải hết 8 từ:
  lúc đếm "4" chưa có màn kết thúc, sau đó end screen + ✓ 8; 0 lỗi console. ⬜ Thầy xem thật trên TOMKO.

## ⭐ Đợt 390 (25/9/2026) — BÌNH NƯỚC ĐIỂM + mỗi lượt một bộ chữ khác
Thầy: (1) chưa hiện điểm khi đang chơi — ô điểm là bình nước lấp lánh, điểm bay vào làm nước sóng sánh; hết giờ nước cạn
dần và thành số đếm lên cho HS hồi hộp; mọi mode; GAME luôn có, activity có ô tích trong Options. (2) PLAY AGAIN / mở lại
game phải ra bộ chữ khác — "trùng nhau quá".
- **`ws-lib.js`**: `createTank({side,k})` → `{el, hit(score), set, drain(final, ms, onStep), reset, stop, destroy}`
  (CSS tự chèn 1 lần, `<style id="ws-tank-css">`, dùng được ở GAME lẫn template): sóng = 2 lớp mask SVG chạy ngang, bọt
  nổi, vệt sáng lướt, `hit` = lắc `wst-slosh` + dâng; mực = `14% + 74%·(1−e^(−điểm/k))` — không tràn, không lộ đội nào hơn
  nhiều. `drain` dùng **setInterval** (rAF treo khi pane ẩn), số đếm chậm dần cuối (ease 2,2), `flyPoint(from,to,"+N")` =
  số bay `position:fixed` gắn vào `body` (tránh bẫy transform của `.wsg-cv`). Âm mới `splash/drip/land`.
  ⚠️ Số trong bình là `<span>`: bản đầu dùng `<b>` và dính luật `.wsg-score b` của GAME (block + relative) ⇒ số dạt trái.
- **GAME**: 2 bình dựng MỘT LẦN, gắn lại vào ô điểm sau mỗi `render()` (dựng mới là sóng chạy lại + đứt cú lắc). Pha mới
  `"count"`: hết giờ ⇒ bàn khoá, `sfx.timeup`, hai bình cạn CÙNG TỐC ĐỘ (đội ít điểm dừng trước), `land`, 0,9 s sau mới
  `"over"` (WINS + số thật + glow đội dẫn). Đang chơi không có glow `lead`/`bump` (lộ đội dẫn). `k = 28`.
- **Template** — ô tích **Score tank** (`opt.wsTank`, mặc định BẬT = `!== false`, `checkOrder` giữa Shuffle và Show answers):
  chơi đơn = bình ngồi chỗ ô ✓ trên khung (ANH EM của `.aw-top-score` vì `setScore` ghi đè innerHTML của nó; `.is-ws-tank`
  trên `.aw-stage` ẩn ô gốc), `finish()` cho cạn xong mới `ui.finish` rồi trả ô ✓ về; Fight = bình trong mỗi
  `.aw-fight-team`, MutationObserver theo số của core (có bonus/điểm trừ), cạn qua **hook core mới `tpl.fightReveal`**.
  Cả hai được dựng ngay ở màn START (`TANKS` WeakMap theo khung/trận). `k`: từ = 6, Mode 3 trận (điểm chữ) = 20, Mode 3
  đơn (✓ = số từ của bài, chỉ từ của bài đổ vào bình) = 3.
- **Bộ chữ khác nhau** — đo (`scratchpad ws-overlap.mjs`, 150 bàn liên tiếp): bàn "easy" cũ luôn chọn bàn NHIỀU từ A1–A2
  NHẤT ⇒ trôi về cùng chữ phổ biến: chung **10,1/16 chữ** với lượt trước (tối đa 13), 19 % từ dễ trùng. Nay: mọi bàn ≥ 55 %
  số từ dễ của bàn tốt nhất là ứng viên, chọn bàn ÍT TRÙNG NHẤT với 8 bàn gần nhất (bàn ngay trước tính ×2) ⇒ **7,8/16**
  (gieo ngẫu nhiên 7,6), 8 % từ trùng, vẫn ~174 từ A1–A2/bàn (ngẫu nhiên 109). GAME nhớ 8 bàn ở `localStorage
  aword-wordshake-recent`. Template Mode 2/3: nhóm từ vào bảng từ `shuffle(items)` mỗi lượt (đo 3 lần mở: 3 bảng khác).
- Đã đo: GAME từ ENGLISH ⇒ số bay + mực 14→26 %, số ẩn; hết giờ ảnh chụp giữa chừng "8 | 12" rồi WINS 9–17 · template đơn
  2 từ ⇒ 14→25→35 %, giải hết 8 từ: lúc đếm "2" chưa có màn kết thúc, sau đó end screen + ✓ 8 · Fight Mode 2 ⇒ bình phải dâng,
  hết giờ: đếm 0 → bảng "TEAM RIGHT WINS 0—1" sau 3,3 s, số thật hiện lại · tắt Score tank ⇒ không bình, ✓ như cũ · 0 lỗi.
  ⬜ Thầy chưa xem/nghe thật (tiếng nước, tốc độ cạn, độ cao bình 40px GAME / 33px Fight).

## ⭐ Đợt 389 (25/9/2026) — TEMPLATE mở bằng màn START của GAME, nút ra hàng ngoài kiểu game, ô tích NEXT
Thầy giao (khi đổi template một act WORDS sang A Show Speed): (1) bỏ màn START gốc của AWord, dùng màn START của GAME;
(2) Options + Mode theo phong cách game; (3) Menu · ‹ › · loa xuống hàng nút ngoài (hàng Options/Mode); (4) ô tích cho
phép Next, MẶC ĐỊNH TẮT. Thầy chốt qua câu hỏi: **cả chơi đơn lẫn Fight** · **có ô 2/3/5 phút = đồng hồ ĐẾM NGƯỢC** ·
**Next tắt = ẨN HẲN ›** · **cho sửa core bằng cờ tuỳ chọn** (3 móc mới, xem `core/HUONG DAN CORE.md` mục Đợt 389).
- **Màn START** (`startScreen`, `mountStartPanel`): logo A SHOW SPEED · 3 ô giờ · PLAY, sao y GAME kể cả chạm đúp một ô
  → chỉ còn ô đó, vuốt ▲▼ / lăn chuột ±1 phút (1–10), chạm đúp lại → 3 ô. Cỡ theo px của GAME qua `--p` (Fight:
  `--ws-u/4.4` vì bảng giữa GAME rộng 440; chơi đơn: `.17 × --aw-u`). PLAY mờ + "Loading…" tới khi `api.ready()` xong.
  Chơi đơn: phủ cả khung, đồng hồ trên khung hiện sẵn số phút. Fight: bàn 0 vẽ ở BẢNG GIỮA (`attachHost` sớm — lúc mount
  `S.host === host` nên không xoá, `drawCentre` ghi đè), mỗi bàn phủ 16 ô "?" tối (`idleBoardHtml`); đồng hồ trận hiện số
  phút qua `ctl.onTimer(0, v)`.
- **Số phút**: `beforePlay` ghi `options.timer = "countDown"` + `timerTotalSeconds` lên act của MỖI bàn; giá trị lấy từ
  biến module `liveTime` (giá trị vuốt ở chế độ một ô KHÔNG lưu, như GAME, nhưng bàn 1 vẫn nhận đúng). Lưu theo MÁY:
  `localStorage aword-showspeed-act-time` (riêng với `aword-wordshake-time` của GAME). ⚠️ Ô Timer trong Options nay bị màn
  START đè mỗi lượt chơi.
- **Hàng ngoài**: chơi đơn `toolsBelow` (core dời ☰ ‹ › 🔊 ⛶ ra, zoom/nhúng thì trả về khung); Fight `fightFrame.boardTools:
  "shared"` (cơ chế Rocket race) + thanh TIME DELAY dời vào từng bàn (`.aw-ws-waitslot`, anh em của `wrap` vì mỗi lần vẽ
  `wrap` bị xoá). CSS kiểu nút GAME (ô nghiêng tối viền neon, 34px) cho MỌI nút hàng đó, kể cả Set assignment/Print
  (nhỏ hơn, 30px) để hàng không lẫn hai kiểu. Nhóm `‹ ›` trong Fight ẩn hẳn (bảng giữa đã có "1 / 8").
- **Ô tích NEXT** (`belowTools`): lưu theo MÁY `localStorage aword-showspeed-next` ("1" = cho), mặc định tắt; bật/tắt
  SỐNG giữa ván (`nextSubs` → `onNextFlip`, chỉ vẽ lại ›, không dựng lại ván). Tắt: chơi đơn không có › (Mode 1 không bỏ
  qua từ, Mode 2 không bỏ bảng — hết giờ thì nộp); Fight không đội nào nhường. Bật: chơi đơn hiện ›; Fight Mode 1 mỗi bàn có
  nút **PASS ›** riêng (= `m1Pass` cũ). ‹ › bị tắt (disabled) thì ẩn bằng CSS, trước PLAY cũng ẩn (chưa nối dây).
- ⚠️ Học sinh (bài giao) KHÔNG đổi: vẫn nút START một-nút của Đợt 383, nút trong khung; nhưng › cũng theo ô tích của máy em
  (mặc định tắt).
- Đã đo (bàn thử `test.html?mode=one|list`): START đúng + 3:00 trên khung · chọn 2 min → 1:58 sau 2 s · › ẩn, bật tích → hiện,
  bấm › sang "2 of 8", tắt → ẩn · zoom: 3 cụm về khung, thu nhỏ: ra lại đúng thứ tự · Menu ▸ Start again → màn START mới, 1 ô
  tích · Fight: START bảng giữa + 2 bàn "?" + đồng hồ 02:00 · PLAY → 2 bàn cùng vào, 1:57/1:57 · bật tích → 2 nút PASS, cả hai
  PASS → "2 / 8", tắt → 0 · chạm đúp + lăn chuột → "1 min", đồng hồ 01:00, hai bàn 0:59 · hết giờ → DRAW · Quiz y như cũ ·
  0 lỗi console. ⬜ Chưa bấm tay trên TOMKO, chưa thử đường thật (đăng nhập → act WORDS → đổi template).

## ⭐ Đợt 388 (25/9/2026) — từ to căn giữa + bay về cột, bộ chữ dễ, ô giờ chạm đúp
- GAME: từ to (và WINS) ĐÚNG TÂM bảng giữa — chữ trong `.wt` inline-block, mũi tên `position:absolute` treo ngoài (lệch về đội ghi điểm).
- GAME: từ đang to KHÔNG có trong danh sách; từ kế tiếp tới ⇒ từ cũ bay (`flyToList`, bản sao trong `.wsg-cv`, đo theo toạ độ 1280) lên
  đầu cột đội đó, các từ cũ trượt xuống (FLIP). Đo: đáp lệch ≤2px. Hết giờ thì màn kết quả thay luôn (từ cuối không cần bay).
- GAME: gõ sai/trùng chỉ `renderSide` + bong bóng — bảng giữa không vẽ lại (trước đó `render()` chạy lại `wsg-pop` = nhấp nháy);
  `wsg-pop` chỉ gắn ở lần vẽ đưa từ mới vào (`G.pop`).
- GAME: `rollBoard(dict,{easy:true})` gieo 60 bàn, 5–7 nguyên âm, chọn bàn NHIỀU từ A1–A2 nhất: 109 → ~250 từ A1–A2/bàn (đo 100 bàn).
- GAME: chạm đúp ô giờ ⇒ chỉ còn ô đó (lướt ra giữa, ▲▼), vuốt lên +1 / xuống −1 phút (1–10), lăn chuột cũng được;
  chạm đúp lại ⇒ 3 ô, ô đã chạm đúp được chọn (số chỉnh không lưu).
- FIGHT template: bảng giữa không có "từ to" (Mode 1 = định nghĩa, Mode 2/3 = dòng định nghĩa, mũi tên cân 2 bên) và gõ sai
  vốn không vẽ lại bảng giữa ⇒ chỉ thêm: cột từ Mode 1/3 trượt (từ mới rơi vào đầu, từ cũ trượt xuống) trong `drawCentre`.

## ⭐ Đợt 387 (25/9/2026) — TÊN MỚI "A SHOW SPEED" + dải điểm thấp + Home mới + chuông 10 s
- **Tên hiển thị = A SHOW SPEED** (thầy chọn): logo GAME, thẻ GAMES, catalog, editor, slogan, đuôi bài giao `SHOWSPEED`.
  ⛔ MÃ NỘI BỘ GIỮ `wordshake` (type, `?g=wordshake`, tên file/thư mục, class `.is-skin-wordshake`) — act/bài giao/link cũ vẫn mở.
- GAME: dải điểm ô 62→40px, bàn chơi y 89→56, hàng nút 44→29px (2/3) ⇒ bản vẽ 1280×**508** (cũ 566). Bỏ dòng luật
  "Same 16 letters…" (chỉ còn dòng Loading/lỗi từ điển). Bỏ nút New game. Home + Sound vẽ lại kiểu game (ô vát neon).
- Home: đang chơi ⇒ hộp "End this game?" (NO/YES, đồng hồ đứng) ⇒ YES về màn chờ; màn kết quả ⇒ về màn chờ; ở màn chờ ⇒
  ra cây GAMES (`ctx.onExit`) — ⛔ trang game KHÔNG có thanh trên AWord, đây là lối ra duy nhất ngoài nút Back.
- Chuông 10 s cuối `sfx.countdown(left)` (ws-lib): giây 10–6 hai tiếng/giây, 5–1 bốn tiếng/giây, cao dần; thay tiếng tích cũ.
- FIGHT template: skin dải điểm ô ~49→~33px, chữ 2.1vw, khoảng trên chỉ đủ thanh MISS WAIT ⇒ dải 69→44px ở màn 1024.
  Vá luôn lỗi có sẵn: ô đồng hồ cao hơn 2 ô điểm 8px (skin ghi đè padding-top của clockbox) — nay `margin-top` = của halves.
  Chuông: HOOK CORE MỚI `tpl.sounds.countdownTick(left)` (engine, đồng hồ đếm ngược, 1 lần/giây ở 10…1, bàn 0 trong Fight);
  template gọi `bell.countdown` (tôn trọng nút tắt tiếng chung `sound.isMuted()`). Áp cả chơi đơn khi đặt Count down.

**TRẠNG THÁI: ✅ ĐÃ VÀO CATALOG** (Đợt 386c, 25/9/2026 — thầy: "đưa template vào catalog New activity luôn", sẽ chỉnh tiếp ở phiên sau) — GAME + template chơi đơn 3 mode chạy được;
FIGHT của template ĐÃ NỐI (core `shared-middle` + skin, xem mục FIGHT). Đã có trong `core/catalog.js` + `TEMPLATE_ICON` (fmtAnagram) + `TPL_SHORT` (WORDSHAKE) + `convert.js` (đổi qua lại như Anagram) + `tpl-files.js`.

## Nguồn gốc
- Game tham khảo: **Wordshake** của British Council (Claude chơi thử + đọc mã 25/9/2026): 16 chữ, 3 phút,
  từ 3–7 chữ, mỗi ô 1 lần/từ, **không cần ô kề nhau**, điểm 3→1 · 4→2 · 5→3 · 6→4 · 7→5, 16 xúc xắc Boggle.
- Thiết kế duyệt qua 4 vòng: `D:\OTHERS\CLAUDE\AWord - thiet ke Wordshake\wordshake-v1…v4.html`
  (cấu trúc = v2 đúng khung AWord; skin neon + dải điểm HUD + âm thanh = v4).

## Bản đồ file
| File | Việc |
|---|---|
| `templates/wordshake/ws-lib.js` | DÙNG CHUNG: `loadDict/lookup/points/rollBoard/wordsOn/canMake/createSfx` |
| `templates/wordshake/ws-dict.txt` | từ điển 18.345 từ (xem mục Từ điển) — `word \t level \t nghĩa` hoặc `=gốc` |
| `templates/wordshake/wordshake.js/.css` | template (3 mode chơi đơn) |
| `templates/wordshake/wordshake-editor.js` | DÙNG LẠI editor Anagram (cùng dạng `{word, clue}`), đóng lại `type:"wordshake"` |
| `templates/wordshake/test.html?mode=one\|list\|free` | trang thử template |
| `games/wordshake/wordshake.js/.css` + `test.html` | GAME cố định (`?g=wordshake`), `mountWordshake(root, ctx)` |
| `games/games.js` | mục `wordshake` (+ `card` = hình card riêng, cơ chế Đợt 385) |

## GAME (gốc GAMES)
- Luôn FIGHT 2 đội trên một màn cảm ứng: cùng 16 chữ, mỗi bên xáo vị trí; từ đội này lấy ⇒ đội kia bấm ra "Taken".
- Hình học vẽ ở px thật của khung fight AWord 1280px (dải 69px · bàn 392 | giữa 440 | bàn 392 × 408) rồi scale.
- Bảng giữa: từ vừa tìm cỡ to + nghĩa (+ "form of X" nếu là dạng biến đổi), 2 cột từ của 2 đội, mũi tên ◀ ▶ chỉ đội.
- Màn chờ: chọn 2/3/5 phút (nhớ ở localStorage `aword-wordshake-time`), PLAY; hết giờ: đội thắng + ≤10 từ
  thông dụng (A1–B2) hai đội bỏ lỡ, dài trước.
- Dưới bàn: Home (về cây GAMES) · New game · Sound.
- `rollBoard`: gieo 16 xúc xắc gốc, bỏ Q, 4–7 nguyên âm, ≥45 từ A1–B2 trên bàn (tối đa 40 lần gieo).
- ⭐ Đợt 395: GAME có nút **Options ▸ LEVEL** EASY/MEDIUM/HARD (`aword-wordshake-level`) ⇒ `rollBoard({level})`: easy = nhánh `easy:true` cũ; medium/hard = `rollLevel()` chọn theo TỈ LỆ từ của dải (B1–B2 / C1–C2) trong 150 lần gieo. Hết giờ: hai số đếm cùng nhịp từng nấc + tiếng tích (`countTick`), ô đội dẫn phóng to ở số đầu tiên vượt (`tank.countTo/landCount`). Template chưa có level.

## Template (Activity) — 3 mode, `opt.wsMode`
| Mode | Bảng | Chơi | Điểm (✓ = điểm nộp bài) |
|---|---|---|---|
| `one` One word | chữ của từ + chữ nhiễu, `opt.wsTiles` 8/12/16 | 1 định nghĩa/lượt, chữ chạy xuống ô xếp, đủ ô là chấm; sai ⇒ chữ về, làm lại | 1/từ |
| `list` Word list | 16 chữ cố định, bấm như bàn phím | danh sách định nghĩa lật dần; bài dài chia nhiều bảng (≤5 từ, ≤16 chữ khác nhau) | 1/từ |
| `free` Free words | 16 chữ giấu 2–3 từ của bài | từ bất kỳ trong từ điển; từ của bài ×2 | ✓ = số từ của bài; điểm chữ hiện riêng "PTS" |
- ENG1/ENG2/VI1/VI2/VOICE đi đường chung (`content-view` + `voiceView` + `createVoicePlayer`).
- ⚠️ Mode 3 KHÔNG được để `score` = điểm chữ: engine in "Score 8/8" cho 1 từ đúng (đã đo, đã sửa).
- `prepare()` nạp từ điển khi mode `free` (màn READY hiện thanh chờ).
- Review: một hàng mỗi từ của bài, `yourText` chỉ là thứ HS đã gõ.

## Từ điển (`ws-dict.txt`)
- Nguồn `ALL ENGLISH WORDS.xlsx` (sheet allwords + wordforms): A1→C2, 3–7 chữ, bỏ `nowords`, bỏ nhóm "hiếm",
  **bỏ -ing/-ed** (thầy 25/9) — theo wordforms + dò gốc, giữ ngoại lệ đứng riêng (evening, morning, ceiling…).
- Nghĩa: tiếng Việt ngắn, thông dụng, nhiều nghĩa ngăn " / " (mẫu thầy: `water` = nước / tưới nước) — 12 trợ lý
  soạn song song; từ không hợp (tên riêng, viết tắt, tục) đánh `#` ⇒ loại (2.784 từ).
- Kết quả: 18.345 dòng = 13.280 từ gốc có nghĩa + dạng biến đổi `=gốc` (hiện nghĩa của gốc). 444 KB, tải khi cần.
- Dựng lại: script `build_dict.py` (scratchpad phiên 25/9) — đọc `words2.json` + `out_XX.tsv` + wordforms.

## Luật / bẫy đã gặp trong đợt này
- ⛔ `.x button{…reset…}` (0,1,1) ĐÈ `.aw-ws-t` (0,1,0) — reset phải viết `:where(.x) button`. Dính 2 lần (game + template).
- Ảnh chụp khung thử KHÔNG vẽ bảng tổng kết (lớp phủ) — kiểm bằng `elementFromPoint`, đừng tin ảnh.
- Skin neon chỉ bật khi `.aw-stage:has(.aw-ws-root)` ⇒ các game khác không đổi.

## FIGHT (template) — ĐÃ LÀM (thầy "Làm Fight luôn", 25/9)
- Core Đợt 386: `tpl.fightLayout:"shared-middle"` + `fightFrame {sideW:392, midW:440, h:408, skin:"wordshake"}` (xem HUONG DAN CORE mục FIGHT).
- Mode 1: vòng thường của trọng tài (như Anagram) — cùng định nghĩa ở bảng giữa, cùng bộ chữ (`SHARED.letters`) nhưng mỗi bàn xáo riêng; đúng trước ⇒ `wordDone(correct:true)`; › = bỏ lượt (`correct:false`).
- Mode 2/3: MỘT bảng chung mỗi vòng (`SHARED.plan/r`), từ đội này lấy ⇒ đội kia "Taken" (`SHARED.found` từ của bài, `SHARED.taken` từ tự do); tìm hết từ của bảng ⇒ cả hai cùng sang bảng mới; bảng cuối / hết giờ ⇒ `ui.finish` ⇒ `ctl.onFinish` ⇒ kết trận theo điểm. Mode 3 trong trận: dải điểm = điểm chữ.
- `SHARED` = WeakMap theo `ctl` của trận (restartMatch dựng ctl mới ⇒ trận mới sạch). Bảng giữa `drawCentre()` (đơn vị `--ws-u` tự đo).
- Đã đo: 392/440/392 × 408 đúng từng px; điểm tâm 208 & 1072; Mode 2 trọn trận "TEAM LEFT WINS 6 — 2"; Anagram & Rocket race Fight không đổi.

## (cũ) ĐỀ XUẤT SỬA CORE — đã làm ở Đợt 386, giữ để tra

1. `tpl.fightLayout: "shared-middle"` — hàng bàn thành `[bàn 0][vùng chung][bàn 1]` (392 | 440 | 392 ở 1280px),
   `ctl.sharedRoot()` trả vùng giữa (như shared-top của Rocket race).
2. `fightFrame.skin: "wordshake"` ⇒ `.aw-fight.is-skin-wordshake` để CSS của template vẽ dải điểm HUD neon.
3. Vòng đấu "một bảng, hết giờ là hết" cho Mode 2/3 (từ bên này lấy thì bên kia mất) — cần luật trọng tài mới;
   Mode 1 đi vòng thường như Anagram (cùng định nghĩa, ai đúng trước ăn).

## Nhật ký
- Đợt 386 `1647ded` GAME · `a8b9425` template chơi đơn · `b124d7a` FIGHT (core shared-middle) · Đợt 386c vào catalog.
- Đã đo đổi template: Anagram (6 từ) → Wordshake giữ word/clue/voice; Wordshake → Quiz 8 câu; Wordshake có trong `switchTargets(anagram)`.
- ⬜ Thầy chưa bấm tay: TOMKO, âm thanh, hết giờ giữa trận Fight; nút ‹ › trong bàn Fight hơi nhỏ.
- Đợt 395 GAME: Options level EASY/MEDIUM/HARD + đếm điểm hết giờ từng nấc song song (chi tiết `GHI CHU DU AN.md`). ⬜ thầy chưa nghe/bấm tay.
