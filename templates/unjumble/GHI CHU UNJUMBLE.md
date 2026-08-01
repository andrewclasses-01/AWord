# GHI CHU — UNJUMBLE (game thứ 11)

**Trạng thái: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy. Chơi thử riêng vẫn được: `templates/unjumble/test.html`.

## ⭐ Đợt 35 (1/8/2026, v0.9.9) — 4 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
> ⚠️ Số đợt: "Đợt 34/v0.9.8" đã bị 1 phiên song song dùng cho **Gameshow** (cùng ngày), nên Unjumble lấy **Đợt 35/v0.9.9**.
Thầy chốt qua AskUserQuestion: nền **chỉ Classic**, đặt ảnh **cover (cắt cho nét)**, intro **đẩy nhẹ ~2.5s**.
1. **Intro zoom + nhạc**: bấm Play → engine phát sẵn `intro.mp3` → lớp phủ `.aw-unj-intro` (chính ảnh
   whiteboard) **đẩy nhẹ** (scale 1.12→1.0 + mờ dần) trong `INTRO_MS=2500`, chạm để bỏ qua, rồi mới vào
   game. Đồng hồ **đứng 0:00 suốt intro** nhờ bật cờ engine `manualTimerStart` (opt-in, KHÔNG sửa core);
   `mount` gọi `ui.startTimer()` khi intro xong (Style khác Classic thì gọi ngay, không intro).
2. **Ảnh làm nền CẢ khung**: `whiteboardgrouped2.png` → copy vào `templates/unjumble/img/whiteboard.png`
   (5,3 MB), đặt làm nền `.aw-stage.aw-unj-active.theme-classic` (`background-size:cover`). `mount` gắn class
   `aw-unj-active` vào stage qua `root.closest('.aw-stage')` (gỡ ở cleanup) — KHÔNG đổi/bỏ class
   `.aw-page/.aw-stage/.aw-below`, an toàn phần nhúng myActivity. Card thành **trong suốt** (bỏ khung đen +
   nền board + doodle SVG) vì ảnh đã có sẵn khung + doodle + chữ "ANDREW WHITE CLASSES BOARD". Điểm/giờ/nút
   nằm đè lên ảnh. Các Style khác (Basic/Classroom/Beach) **giữ nguyên** card tint cũ (CSS gate `.theme-classic`).
3. **Kéo chữ = con trỏ text, chữ đứng yên**: bỏ cơ chế placeholder chèn-dồn realtime (`.aw-unj-ph` gỡ).
   Nay kéo → hiện **thanh nháy dọc** `.aw-unj-caret` ở khe gần nhất (row-aware theo tâm ô), **các chữ KHÔNG
   dời** (chữ nguồn chỉ mờ `.is-dragsrc`), **thả mới chèn** (`positionCaret` lưu chỉ số chèn full-array vào
   `caret.dataset.insert`; `caretDropIndex` quy về chỉ số sau khi tách từ kéo cho `commitReorder`).
4. **Bỏ dòng "Put the words in the right order"**: `render()` chỉ thêm `.aw-unj-clue` khi item CÓ clue
   riêng của thầy (bỏ nhánh generic); `measure()` guard `clueEl` null.
Tự test trình duyệt thật (0 lỗi console): intro scale 1.12→1.0+fade, biến mất ~2.5s, đồng hồ giữ 0:00; kéo →
caret hiện + chữ đứng yên (đo `orderDuringMove === before`) + thả đổi đúng thứ tự + dọn sạch caret/clone;
generic clue mất; đổi Style→Basic bỏ ảnh whiteboard, về Classic có lại.
⚠️ Ảnh 5,3 MB (nền tải 1 lần) — nếu muốn nhẹ hơn sau này có thể nén/resize.
⏳ CHỜ TEST TOMKO: cảm giác caret + kéo trên màn cảm ứng; intro trên 4K; phần bị cover cắt ở mép trên/dưới.
> Sửa tiếp game này thì chỉ đụng `templates/unjumble/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

Dựng lại act Classic của thầy: **https://wordwall.net/resource/116872783/unjumble**, style **Whiteboard**
(thầy chốt Whiteboard = "Classic" cho AWord). Nghiên cứu đầy đủ: `docs/11-UNJUMBLE.md`.

## Cách chơi
Thầy gõ nguyên **câu đúng**; game tách câu thành **các TỪ** và **xáo trộn thứ tự từ** (derangement —
không từ nào ở sẵn đúng chỗ, bắt đầu 0 điểm). Học sinh **kéo-thả từ** để sắp lại thành câu đúng
(kéo thật, chèn vào giữa + cả câu dồn lại — đúng như Wordwall). Từ vào đúng chỗ → **xanh lá**.

Dấu câu dính liền từ cuối ("week." là 1 từ). Chữ = **bút xám #6f7680 nghiêng viết tay** trên **dòng kẻ**;
nền bảng #f6f6f3 trong **khung viền đen** + **doodle góc** (tia sét/sao/chó/người que — vẽ SVG, KHÔNG branding).

## 3 chế độ chấm (Options → Marking) — thầy chốt đủ 3
- **Every word** (`everyword`): chấm từng từ khi vào đúng chỗ (xanh); **1 điểm/từ**.
- **Every word + bonus** (`bonus`, MẶC ĐỊNH): như trên, nhưng nếu giải cả câu mà **mọi lượt kéo đều đặt
  từ vào ĐÚNG nhà** (không lỡ tay) → hiện **"PERFECT"** bay vào điểm + **NHÂN ĐÔI** điểm câu đó.
- **On submit** (`submit`): kéo tự do rồi bấm **Submit** → chấm từng vị trí xanh/đỏ lần lượt (stagger) +
  hiện **câu đúng** nếu có từ sai; 1 điểm/từ đúng.
Thêm option **Alignment** (Left/Centered) căn chữ. Timer/Shuffle/Show answers do engine lo.

## File
| File | Vai trò |
|---|---|
| `unjumble.js` | game: `prepareItem` (tách từ + derangement), kéo-thả pointer (chuột+cảm ứng) chèn+reflow, 3 mode, `flyScoreGain`/`pulseScoreTo`/`fadeSwap`/`finish` (nhân bản Anagram) |
| `unjumble.css` | look Whiteboard (prefix `.aw-unj-`) + doodle + dòng kẻ + editor CSS; theme tint cho Basic/Classroom/Beach |
| `unjumble-editor.js` | editor **Sentence \| Clue** (dán Excel, Swap, Duplicate, kéo sắp xếp) — nhận cả key cũ word/text |
| `unjumble-sound.js` + `sounds/` | 37 mp3 THẬT theme Whiteboard (pickup×8/drop×8/correct×4/fastcorrect×4/incorrect×4/fastincorrect×4/perfect/intro/restart/timesup/gamecompleted) |
| `sample-unjumble.js` | 6 câu mẫu (thì tương lai với "will") |
| `test.html` + `test.js` | trang chơi thử |

## Âm thanh
Bản đồ sự kiện→âm lấy thẳng từ **Audios.json** của theme (không đoán). Nguồn gốc + đủ 41 file
(kèm menu/leaderboard/reveal/nhạc nền) lưu ở `D:\APP AND DATA\AWord-data\Source\Sound effect\UNJUMBLE\`
(+ đồ họa ở `...\Graphic\UNJUMBLE\`). Template chỉ chép 37 file thực dùng.
`tpl.sounds` nối engine: play=intro, restart=restart, timeWarning=timesup, complete=gamecompleted.

## Đã tự test (trình duyệt thật, 0 lỗi console)
- Tách câu đúng ("week." giữ dấu chấm), derangement → **bắt đầu 0 điểm** (đã sửa: bản đầu lọt 5/8 từ đúng sẵn).
- Kéo-thả: hiện placeholder + clone bám con trỏ, thả → đổi thứ tự, **dọn sạch clone/placeholder** (không sót).
- **everyword**: giải "I like tea." → 3 điểm; **bonus perfect**: giải sạch 6 từ → **12 điểm** (×2) + "PERFECT" bay.
- **submit**: submit câu sai → 5 từ đỏ + badge X + **hiện câu đúng** + 0 điểm.
- Căn giữa (align:center) OK, clue tùy chỉnh hiện OK, **Game complete** (ui.finish) chạy OK.
- Style Whiteboard: nền #f6f6f3, khung đen 9px, chữ italic Segoe Print, 4 doodle, dòng kẻ — đúng.

## Đánh đổi / LƯU Ý
- **Kéo-thả insert+reflow**: khi chèn 1 từ, các từ khác đổi vị trí (đúng bản chất Wordwall). Từ đã xanh có
  thể bị đẩy lệch nếu kéo từ khác — học sinh xây câu trái→phải là mượt nhất. **KHÔNG khóa cứng** từng từ đúng
  (khóa + reflow xung khắc chỉ số); cả bàn chỉ khóa khi giải xong.
- **"Perfect" nghĩa là**: mọi lượt kéo đều đưa từ về đúng nhà (giải trái→phải là đạt). Kéo lung tung xong mới
  đúng = không perfect (đúng ý "bonus for perfect").
- **Font viết tay** dùng stack hệ thống `Segoe Print/Bradley Hand/Comic Sans MS/Baloo 2` (offline, có sẵn trên
  Windows TOMKO). Nếu muốn chuẩn 1 font riêng → nhúng woff2 sau.
- Look Whiteboard là **mặc định RIÊNG của Unjumble** (không sửa `core/themes`); đổi Basic/Classroom/Beach chỉ
  re-tint nền/khung/mực + ẩn doodle. Không đụng `core/`.

## ĐỀ XUẤT SỬA CORE (chưa làm — chỉ ghi lại)
- Không cần. Chỉ dùng cờ có sẵn (`ui.finish`, `buildExtraOptions`, `tpl.sounds`, `optionsNeedRestart`).
- (Tùy chọn tương lai) engine có thể expose 1 âm "TimesUp" riêng khi hết giờ đếm ngược — hiện dùng tạm cho
  `timeWarning` (5s cuối).

## CHỜ TEST TOMKO
(a) Cảm giác **kéo-thả trên màn cảm ứng 86"** (nhấc/chèn/dồn có mượt, có hụt tay không).
(b) **Âm thanh** thật (pickup/drop/correct/perfect...) trên loa lớp.
(c) Fullscreen giữ tỷ lệ trên màn 4K.
(d) Câu dài nhiều từ (wrap nhiều dòng) có tràn khung không.
