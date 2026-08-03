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
