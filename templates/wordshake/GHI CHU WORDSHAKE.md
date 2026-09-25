# GHI CHÚ WORDSHAKE — template #21 + game cố định trong GAMES

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
