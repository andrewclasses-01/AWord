## ⛔⛔ Đợt 450 (03/10/2026) — BẢN 2D ĐÃ GỠ HẲN. Balloon pop = TRAIN RUSH 3D ở MỌI chế độ (Single + Fight); chưa giao bài, chưa Showdown. Mọi mục bên dưới nói về bản 2D cũ (lịch sử git trước Đợt 450). Đọc `balloon-pop.js` đầu file + GHI CHU DU AN Đợt 449/450.

## ⭐ Đợt 449 (03/10/2026) — MODE ▸ FIGHT = TRAIN RUSH 3D

- Single / Showdown / bài giao: vẫn bản 2D trong file này. MODE ▸ Fight ⇒ `ownFight` ⇒ trận TRAIN RUSH 3D (myGame `balloon-pop` mẫu 1aj) trong ô `.aw-tr-host` phủ trọn trang.
- `3d/` + `assets/sound-1ah/` + `vendor/cannon-es.js` là BẢN CHÉP — sửa ở myGame (bản mới = tên mới) rồi chạy `python tools/chep-train-rush.py` (đổi `GOC` nếu tên mô-đun đổi + đường `import("./3d/fight-1aj.js")` + danh sách `TR3D_CSS` trong balloon-pop.js).
- Bàn thử: `scratch/dot449-tr.html` (`?src=anagram`). Lái: `window.__fight` (G, boards, start, finish, destroy).

# GHI CHU — BALLOON POP

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy. **Lưu ý: mục "Điểm cần POLISH" cuối file vẫn CHƯA làm** (blimp chồng lane, hiện
2 đồng hồ) — thầy chưa yêu cầu, hỏi trước khi tự sửa.
> Sửa tiếp game này thì chỉ đụng `templates/balloon-pop/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

## Game này là gì
Bản dựng lại act **Wordwall "Balloon pop"** (resource 116864480) theo **style Wild West** — style này
được coi là **Classic** trong AWord (thầy chốt 1/8/2026). Đồ họa vẽ lại 100% bằng CSS/SVG (KHÔNG chép
ảnh gốc Wordwall — tránh bản quyền); âm thanh dùng bản gốc Wordwall đã tải (xem dưới).

**Cách chơi**: 1 toa tàu dưới đáy hiện 1 ĐỊNH NGHĨA. Các KHINH KHÍ CẦU (blimp) trôi ngang mang KEYWORD.
Bấm/chạm blimp mang keyword khớp định nghĩa → keyword rơi thành THÙNG CARGO lên tàu (đúng → tàu chạy
sang định nghĩa kế; sai → thùng vỡ). Điểm = số keyword khớp. Đồng hồ đếm ngược cả ván; khớp hết levels
trước khi hết giờ = "Game complete", hết giờ = "Time's up".

## Mô hình dữ liệu (khớp Edit Content của Wordwall)
`content.items = [{ keyword, definition }]` — keyword "hangs from balloons", definition "appears on the
train". **min 5, max 100**. Mỗi item Wordwall còn cho gắn ảnh (🖼️) — CHƯA làm (placeholder trong editor).
Editor có nút **Swap Columns** + dán từ Excel 2 cột + kéo sắp xếp (giống anagram-editor).

## Options (đọc trong panel Options ngoài khung — `buildExtraOptions`)
- `bpTimerSeconds` (mặc định 60) — tổng thời gian ván.
- `bpSpeed` (1..10, mặc định 5) — tốc độ blimp trôi.
- `bpLevels` (mặc định 10) — số định nghĩa chơi trong 1 ván (≤ số item).
- `bpBonusTime` / `bpBonusPoints` / `bpBonusX2` — bóng bonus (Extra time / Points / x2 score).
- `showAnswers` (chung của engine) — màn Show answers cuối ván.

## Âm thanh
27 file mp3 trong `./sounds/` (bản gốc Wordwall theme `western2`, tải .ogg → ffmpeg mp3). Nguồn +
mapping trạng thái: `D:\APP AND DATA\AWord-data\Source\Sound effect\BALOON POP\GHI CHU.md`.
Module `balloon-pop-sound.js` (mẫu `otb-sound.js`): pop/cargoCorrect/cargoWrong/ting/trainChug/
trainToot/trainTime/balloonTime|Loot|Combo/planeFlyBy/complete/gameOver/timesUp/restart/reveal...
Balloon Pop KHÔNG dùng clocktick/chip — nhịp "đồng hồ" là tiếng tàu chạy (TrainChug/TrainTime).

## Kỹ thuật (đã tuân CONG THUC MAU + HUONG DAN CORE)
- **1 vòng lặp `requestAnimationFrame`** duy nhất chạy blimp + đồng hồ + cargo, tính theo delta (clamp
  100ms). Tab ẩn → rAF dừng → cả game TẠM DỪNG (đồng hồ cũng dừng vì trừ trong cùng loop) — KHÔNG dùng
  wall-clock timer nên không bao giờ hết giờ lúc tab ẩn.
- `inlineTimerBar:true` → dùng `ui.topbarMid` cho đồng hồ đếm ngược + thanh tiến độ levels.
- `ui.setScore` / `ui.setNav` / `ui.finish({title, review, perQuestion,...})` như open-the-box.
- Sizing bằng `cqw` (fullscreen giữ tỷ lệ). Blimp định vị bằng `left%/top%` của SCENE (KHÔNG
  `transform: translate(%)` vì % của transform tính theo chính phần tử — bẫy đã tránh).
- `element.animate()` cho crate rơi có `setTimeout` dự phòng + cờ `done` (CONG THUC MAU §3.4).
- Phần tử fx căn giữa bằng `translate(-50%,-50%)` đều BAKE -50% vào mọi mốc keyframe (§3.5).
- `escapeHtml` mọi text người dùng. Class tiền tố `.aw-bp-`. KHÔNG sửa `core/`.

## Đã test (1/8/2026)
Test qua `templates/balloon-pop/test.html` (server local). Vì Browser pane khi ẩn thì rAF treo, đã test
LOGIC bằng cách patch rAF thành bộ bước-khung thủ công + remount, xác nhận: blimp spawn/trôi đúng tốc độ,
đồng hồ giảm, **pop đúng → +điểm + lên level + tàu chạy**, **pop sai → thùng vỡ, không điểm/không lên**,
**hết giờ → panel "TIME'S UP" (Score/Leaderboard/Show answers/Start again/Play different)**, Show answers
map định nghĩa→keyword đúng. **0 lỗi console.** Sau đó chơi LIVE (pane hiện): cảnh Wild West + tàu +
blimp + máy bay + biển gỗ render đẹp, sát Wordwall.

## Điểm cần POLISH (đợt sau — hỏi thầy ưu tiên)
1. **Blimp có thể chồng nhau / dồn cụm** ở khung hẹp (3 lane gần nhau, blimp cao ~11cqw). Cần giãn lane
   theo chiều cao khung hoặc tránh spawn trùng lane khi lane đang bận.
2. **Hiện 2 đồng hồ**: đồng hồ riêng (topbarMid, đang chạy) + đồng hồ engine bên trái hiện "0:00" (vì
   `options.timer:"none"`). Xem "ĐỀ XUẤT SỬA CORE".
3. Cargo rơi hiện là 1 đường cong đơn giản — có thể thêm nảy (CargoBounce) khi chạm/khớp.
4. Bóng bonus: hiện spawn ~14% khi bật; hiệu ứng nhận thưởng còn tối giản (chỉ chữ nổi). Có thể làm
   "loot" bay vào điểm/đồng hồ cho rõ.
5. Chưa có ảnh cho keyword/definition (Wordwall có). Editor đã để nút placeholder.
6. Chưa gắn nhạc nền (Wordwall western có 2 track nhưng act này KHÔNG tải — nên bỏ, đúng bản gốc).

## ĐỀ XUẤT SỬA CORE (KHÔNG tự sửa — chờ phụ trách tổng)
- Khi template có `inlineTimerBar:true` VÀ `options.timer==="none"`, engine nên **ẩn ô đồng hồ trái**
  (timerEl) để tránh hiện "0:00" trùng với đồng hồ riêng của template. Hiện lách bằng cách để đồng hồ
  riêng trong topbarMid; ô trái vẫn hiện 0:00. (Điểm 2 mục polish.)

## Đợt bổ sung — Penalty "points off" (3/8/2026)
Thêm option `pointsOff` (0..5, mặc định 0): mỗi lần pop SAI (thùng vỡ trong `breakCrate`) trừ `pointsOff`
điểm — cho phép điểm âm, KHÔNG kẹp về 0. Khi `pointsOff===0` hành vi giữ nguyên byte-identical (không gọi
`updateScore`, `ui.finish` vẫn để score mặc định = correctCount). Chỉ đụng file trong `templates/balloon-pop/`.

## File của template
`balloon-pop.js` (game) · `balloon-pop.css` (cảnh + editor CSS) · `sample-balloon-pop.js` (20 cặp mẫu) ·
`balloon-pop-sound.js` (âm thanh) · `balloon-pop-editor.js` (soạn keyword/definition) ·
`sounds/` (27 mp3) · `test.html`/`test.js`.

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

⭐ **Template này là ca nặng nhất**: panel cũ cao **757px** trong khi chỗ cho phép 645px ⇒ **nó ĐANG
PHẢI CUỘN** (chưa ai báo). Ba bộ chỉnh số ▲▼ cao 69px mỗi cái là thủ phạm chính; nay Round time và
Levels dùng stepper **nằm ngang**, Balloon speed thành thanh trượt.

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **757px → 424px** (bản cũ **phải cuộn**, nay không).

---

## Đợt 349 (20/9/2026) — NỐI `onPause` CHO MENU PAUSE (cơ chế Đợt 91 của core): mở ☰ Menu là ĐỒNG HỒ + BLIMP ĐỨNG THẬT · chỉ `balloon-pop.js` (+40 dòng) · ✅ THẦY DUYỆT (chat 20/9) → COMMIT + PUSH · ⬜ thầy chưa bấm tay trang thật

**Lỗi:** mở ☰ Menu giữa ván thì lớp mờ hiện ra, nhưng đồng hồ đếm ngược vẫn chạy và blimp vẫn trôi phía sau (đo mã cũ:
Menu mở 3 s ⇒ 0:49 → 0:46, blimp dịch ~26 % bề ngang). Nguyên nhân: mọi thứ thời-gian-thực của game này nằm trong MỘT
vòng lặp `requestAnimationFrame` (`tick`) — `freezePlay()` của engine chỉ dừng được animation CSS/WAAPI trong sân + mp3 của
các pack `core/sfx.js`; vòng rAF thì engine không thấy, template phải tự nối hook `tpl.onPause`. Bốn game maze-chase /
flying-fruit / whack-a-mole / running-team đã nối từ Đợt 91, game này bị sót (grep `onPause` = 0).

**Sửa (KHÔNG đụng `core/`, không đụng template khác):**
- Cầu nối cấp module `bpPauseHandlers` (mẫu `ffPauseHandlers` của flying-fruit — mount() mỗi ván một bộ closure, còn
  `onPause` là hàm cấp template); `cleanup()` đặt lại `null` để ván sau không gọi nhầm handler của ván đã dọn.
- `pauseGame()`: nhớ `wasRunning = !!rafId`, `cancelAnimationFrame`, `lastTs = 0`. `resumeGame()`: chỉ chạy khi
  `wasRunning` và chưa `ended`/`dead`/chưa có rAF khác ⇒ `lastTs = 0` rồi `requestAnimationFrame(tick)` lại.
- Là **kiểu đồng hồ 2 (DELTA)** theo `core/HUONG DAN CORE.md` mục onPause: `tick` tính `dt = ts − lastTs`, nên xoá `lastTs`
  là khung hình đầu sau resume có `dt = 0` — **không mất một mili-giây nào của ván, cũng không nhảy**. Không cần dịch hạn.
- Dừng rAF là dừng trọn: đồng hồ, blimp trôi, spawn blimp, nhịp máy bay (`ambientTimer`). Tiếng mp3 (máy bay/tàu/pop) và
  animation máy bay thì core đã dừng sẵn (`pauseActive` + `stage.getAnimations`), đo thấy `plane: paused`.
- Hook `onPause(paused)` trên object template, y hệt 4 game kia.

**Đã đo trên bàn thử `test.html` (dev server cổng 5549, Browser pane hiện — rAF mới chạy):**

| Tình huống | Đồng hồ | Blimp (`style.left`) |
|---|---|---|
| Chưa mở Menu, 2 s | 0:57 → 0:55 | trôi ~17 % |
| ☰ Menu mở, 3 s | **0:44 → 0:44** | **4 blimp giữ nguyên toạ độ** |
| Bấm Resume, 2 s sau | 0:44 → 0:42 (đã dừng ~18 s mà không mất giờ) | trôi lại |
| Menu → Start again → Play (ván 2) | 0:58 → 0:56 chạy bình thường; mở Menu lần 2 đứng 0:46 suốt 2 s | đứng |
| ĐỐI CHỨNG NGƯỢC mã cũ (`_backup/dot349/`) | Menu mở 3 s: **0:49 → 0:46** | trôi tiếp |

Console 0 lỗi cả hai lượt. Mã băm file mới sau khi trả lại từ đối chứng: `b14e0e2c…7edb55`.

**Giới hạn đã biết (không sửa, đúng "Giới hạn đã biết của bước 4" trong HUONG DAN CORE):** máy bay bay ngang có
`setTimeout(5600)` dọn xác dự phòng, Menu mở lâu hơn thế thì lúc mở lại máy bay đã biến mất giữa trời (đo: `plane: null`
sau 18 s) — chỉ lệch hình một nhịp, không ảnh hưởng điểm/giờ. Thùng hàng đang rơi lúc bấm Menu cũng thuộc giới hạn này.

Backup trước sửa: `_backup/dot349/`. Danh sách "7 game đã nối onPause" ở `core/HUONG DAN CORE.md` nay thực tế là 8 —
KHÔNG sửa vì đợt này không đụng `core/`; phụ trách tổng cập nhật khi tiện.

---

## Đợt 515 (chép từ GHI CHU DU AN.md) (14/10/2026) — TRAIN RUSH: FIGHT MỘT MÀN 2 TÀU SONG SONG + iPAD (như Rocket Race) + OPTIONS LEVELS / TIME ROUND

**Thầy giao (14/10):** "màn Fight là 1 màn hình duy nhất, 2 tàu chạy song song; tàu xa có khinh khí cầu xa hơn, nhỏ hơn; tàu xong màn phóng lên trước,
tàu sau ở lại làm nốt, xong cũng phóng đi rồi báo điểm; điều khiển bằng iPad như ROCKET RACE". Thiết kế trước ở myGame (bản phác
`balloon-pop/thiet-ke-fight-1-man.html`, 2 vòng, chốt bằng AskUserQuestion) ⇒ "ok build" ⇒ myGame **1ap** (`eb51ace` … `4c6b706`, hồ sơ myGame
`balloon-pop/NGHIEN CUU GAMEPLAY.md` mục 40) ⇒ "ok tiếp chặng 2" ⇒ ghép AWord đợt này.

**Thầy chốt:** góc máy quay A · ô điểm đỏ/xanh = THANH GIỜ của màn (đầy = Time round, rút khi đội còn chơi, dừng khi đội xong; cả 2 xong ⇒ phần còn
lại rút về 0, điểm tăng — 1 giây = 1 điểm) · chờ đội kia thoải mái · thanh rút hết khi chưa xong ⇒ tàu DỪNG, OUT, đội kia làm nốt màn đó rồi HẾT TRẬN ·
LEVELS Off/1–20 thay Max cars · TIME ROUND Off/1–10 phút/∞ thay None/Count up/Count down (CẢ Single) · mặc định LEVELS 5 · TIME ROUND 2 phút ·
chạm màn lớn được cả quả đội bạn; nút iPad Off / iPad + màn lớn (MẶC ĐỊNH) / Chỉ iPad.

**1. Chép game** — `tools/chep-train-rush.py`: GOC `fight-1ap.js` + `GOC_THEM` [`tr-padui-1ap.js`] (màn iPad, pad.html nạp) + CSS `fight-1ap.css`.
`3d/` nay: bp3d-1ap, fight-1ap, fight-cine-1ap, west-world-1ap (2 ray), tr-padlink-1ap (= rr-padlink Đợt 514, lệnh `pop:<số>`), tr-padui-1ap… (NGUON.json = myGame `4c6b706`).

**2. `templates/balloon-pop/balloon-pop.js`** — Single + Fight dùng lõi 1ap. Options PHẲNG MỚI `trLevelCount` (0–20) · `trRound` (0 Off · 1–10 · 11 = ∞)
— KHÔNG dùng lại `trLevels` (nghĩa cũ Max cars) / `timer` (nghĩa cũ giờ cả ván). `hideTimerOption: true` (ẩn hàng Timer của engine); `buildExtraOptions`
thêm 2 thanh LEVELS / TIME ROUND (xanh lá, Off ở 0, ∞ ở 11), bỏ Max cars. Act chưa có `trRound`: ĐÃ TỪNG lưu Options Train rush (tr* Đợt 452 /
trainRush Đợt 450) ⇒ suy từ timer cũ (None ⇒ Off · Count up ⇒ ∞ · Count down ⇒ số phút kẹp 1–10); act khác (timer mặc định "none" của AWord) ⇒ 2 phút.
Fight: `createTrainRushFight({ options, padSignal, onPad })`; Options ▸ Apply (liveOptions) ⇒ `fight.setOptions` ⇒ chơi lại từ đếm 3-2-1.
`trPadLink()`: kênh bắt tay + claim `ipad_now` { game: "trainrush", fight } khi nút iPad không Off; `hold` từ lúc có iPad nối (Đợt 513); Off / rời trận ⇒ thả.

**3. iPad** — `templates/balloon-pop/tr-pad-signal.js` (chép khuôn rr-pad-signal: trpad_host / trpad_pad0 / trpad_pad1, kind `trainrush-pad` ⇒ thêm
APP_DATA_KINDS `core/store.js`) · `core/ipad-now.js` nhận game "trainrush" · `pad.js`: game "trainrush" ⇒ `showTR(team)` = `mountTrainPad` (cảnh 2D đội mình,
nút ‹ về chọn đội) · `showTRChooser` (TRAIN RUSH · CHOOSE YOUR TEAM, đỏ/xanh, đội đã có iPad ⇒ chỉ báo, không giành) · màn chờ chung nhắc Train rush Fight.

**Đã kiểm (worktree web-wt-dot515, `scratch/dot515-tr.html?padsig=local` + `pad.html?padsig=local`, 14/10):** Single lõi 1ap · act kiểu cũ (Count down 3 phút,
trLevels 8) ⇒ TIME ROUND 3 · LEVELS 5 · act mẫu ⇒ 5 · 2 phút · bảng Options THẬT: không còn hàng Timer, có LEVELS / TIME ROUND, kéo Off / ∞ ⇒ Apply ⇒ game nhận
+ act lưu `trLevelCount 0 / trRound 11` · Mode ▸ Fight ⇒ `ipad_now` trainrush · pad.html ⇒ màn chọn đội TRAIN RUSH ⇒ chạm TEAM 1 ⇒ nối thẳng ("on"), claim
`hold: true` · iPad nhận trạng thái + bố cục · chạm THẬT quả DESCRIBE trên pad.html ⇒ thùng rơi trúng toa, +5, tàu phóng đi · nút iPad Off ⇒ ipad_now ""
· bật lại ⇒ trainrush hold · Mode ▸ Single ⇒ thả · đường engine `ownFight` mở / dỡ sạch + thả claim · 0 lỗi console. Hàm suy Options thử 4 kiểu act (node).
Bẫy gặp: ô `#pad` của pad.html cao 0 ⇒ màn iPad đo nhầm ⇒ myGame `4c6b706` màn iPad `position: fixed` + đo chính nó.
⬜ thầy thử TOMKO + 2 iPad thật (đăng nhập cùng tài khoản; trang chủ ▸ iPad ▸ chọn đội).

## Đợt 517 (14/10/2026) — TRAIN RUSH FIGHT 1 MÀN CHỈNH CỠ + MÀN iPAD KIỂU A "MIỀN TÂY HOÀNG HÔN"

**Thầy thử Đợt 515 (14/10) ⇒ 5 ý:** (1) máy bay kéo băng điểm bay quá cao, không nhìn rõ ⇒ hạ thấp · (2) thú đuổi nhau xa nhau ⇒ còn 1/2 ·
(3) 2 tàu sát mép dưới, chật ⇒ nâng lên, chừa đất + cỏ tiền cảnh trước tàu đỏ · (4) tàu to hơn, khinh khí cầu nhỏ hơn · (5) màn iPad xấu ⇒ thiết kế lại để duyệt.
Làm ở myGame **1aq** (`f1d8750`, `bb3a0ab`; hồ sơ myGame `balloon-pop/NGHIEN CUU GAMEPLAY.md` mục 41). Bản phác iPad `thiet-ke-ipad-1aq.html` 3 kiểu × 9 màn
⇒ thầy chọn **A Miền Tây hoàng hôn** (dặn: bánh xe đang quay ngược ⇒ sửa) + "chờ iPad xong, lên AWord 1 lần".

- `tools/chep-train-rush.py`: GOC `fight-1aq.js` · GOC_THEM `tr-padui-1aq.js` ⇒ `3d/` nay bp3d-1aq · fight-1aq · west-world-1aq · animals-1aq · sign-chase-1aq · tr-padui-1aq
  (bỏ 1ap/1ah cũ; NGUON.json = myGame `bb3a0ab`). Lõi 1aq (chỉ Fight; Single y hệt): tàu ×0,86 (cũ 0,74) · khinh khí cầu ×0,66 (cũ 0,84) · máy quay nhìn thấp
  hơn (look y 5,7 → 3,7) + làn bay hạ · máy bay băng điểm y 9,6 z −5 (giữa 2 ray; cũ y 13,4 sát mép trên) · cặp thú đuổi nhau khoảng hở × 0,5.
- `templates/balloon-pop/balloon-pop.js`: Single `./3d/bp3d-1aq.js` · Fight (toFight + ownFight) `./3d/fight-1aq.js`.
- `pad.js`: `trMods` ⇒ `3d/tr-padui-1aq.js` — màn chơi kiểu A (trời chiều, núi đỏ thị sai, đầu máy hơi nước chi tiết, bánh quay ĐÚNG chiều, toa gỗ bảng
  định nghĩa viền màu đội, khinh khí cầu vỏ vải màu đội, thùng nghiêng theo vật lý, thanh gỗ: đội · LEVEL k/n + thanh giờ · điểm đội bạn · điểm mình,
  thẻ bảng truy nã GET READY / 3-2-1 / TIME'S UP / YOU WIN + 2 điểm, dải TRAIN FULL / LEVEL COMPLETE +thưởng / GET READY LEVEL n) · `showTRChooser` ⇒
  `mountTrainChooser` (màn chọn đội vẽ cùng kiểu; đội đã có iPad ghi "● iPad already connected", chạm chỉ báo).
  Game gửi thêm cho iPad: `os` điểm đội bạn · `lvc` số màn · `cd` số đếm · `bn` thưởng giờ · góc nghiêng thùng.

**Đã kiểm (worktree web-wt-dot517, `scratch/dot517-tr.html?padsig=local` + `pad.html?padsig=local`, 14/10):** Single mở màn chờ TRAIN RUSH (lõi 1aq) ·
Mode ▸ Fight ⇒ trận 1 màn · pad.html ⇒ màn chọn đội kiểu A ⇒ chạm THẬT TEAM 2 ⇒ nối "on" ⇒ START ⇒ iPad thấy tàu xanh #2 + bảng định nghĩa + quả BAR ⇒
chạm THẬT quả BAR ⇒ thùng rơi đúng toa trên màn lớn (0:5) ⇒ iPad "TRAIN FULL!" · 0 lỗi console 2 tab. myGame (2 tab) đã chạy đủ: GET READY ⇒ chơi ⇒
LEVEL COMPLETE thưởng giờ ⇒ màn 2 (LV.2, toa than) ⇒ End game ⇒ YOU WIN 112 : 93.
⬜ thầy thử TOMKO + 2 iPad thật.

## Đợt 518 (14/10/2026) — TRAIN RUSH: iPAD HẾT GIẬT

**Thầy thử Đợt 517 trên iPad thật:** "cứ giật giật, hộp thả xuống kể cả khi nằm trên tàu rồi vẫn giật 2 bên theo chiều ngang — do hạ tầng hay do game?"
⇒ **Do code game, không phải hạ tầng.** (1) iPad đẩy tiếp máy quay / tàu / khinh khí cầu theo vận tốc giữa 2 tin, nhưng THÙNG đứng yên ở vị trí tin cuối
⇒ thùng trôi lùi so với tàu rồi giật về ~20 lần/giây (đo: biên độ 20 px khi tàu chạy đều, 160 px lúc tàu phóng đi). (2) đẩy tiếp tính từ lúc tin TỚI ⇒ Wi-Fi làm
tin tới không đều ⇒ cả cảnh nhảy. (3) shadowBlur khung toa chờ đắt trên Safari iPad.
- myGame **1ar** (`e98164e`, hồ sơ mục 42): lõi gửi thêm giờ game `t` + vận tốc thùng; iPad (`3d/tr-padui-1ar.js`) tính vị trí theo GIỜ GAME (đường bao trên độ lệch
  giờ = tin ít trễ nhất), thùng đẩy theo vận tốc; quầng sáng toa chờ = nét to mờ. **Chạm 3 lần góc phải dưới iPad ⇒ bảng đo** (FPS · ms vẽ · nhịp tin · ping).
  Đo lại: thùng↔tàu biên độ 0,7 px (cũ 20 px), lúc phóng 1,3 px (cũ 160 px).
- `tools/chep-train-rush.py` GOC fight-1ar / GOC_THEM tr-padui-1ar · `balloon-pop.js` 1ar · `pad.js` tr-padui-1ar.
- Đã kiểm: bàn thử `scratch/dot517-tr.html?padsig=local` Single + Mode ▸ Fight (lõi 1ar), iPad nối nhận giờ game, 0 lỗi console.
⬜ thầy thử lại iPad thật; còn giật thì chạm 3 lần góc phải dưới, chụp bảng đo gửi em.

