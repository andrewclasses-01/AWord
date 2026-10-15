# GHI CHÚ RACING WORDS (template `racing_words`)

Đua siêu xe 3D 2 đội trên bộ câu hỏi kiểu Quiz. THIẾT KẾ ở kho myGame `speed-run/` (tên cũ SPEED RUN) — hồ sơ đầy đủ từng mẫu: `myGame/speed-run/NGHIEN CUU GAMEPLAY.md`.

## Đợt 529 (15/10/2026) — myGame mẫu 3p (mượt + chạm đúp bỏ intro)
- GOC công cụ = `rw-3p.js`; `GAME = "./3d/rw-3p.js"`. File 3p: rw · sr3d · sr3d-car · sr3d-intro · sr3d-carmeta (bảng số đo 13 xe — thêm xe mới ở myGame thì sinh lại bảng, xem đầu file).
- Đo / sửa: GHI CHU DU AN Đợt 529 + myGame `speed-run/NGHIEN CUU GAMEPLAY.md` mục 28. Bàn thử `scratch/dot529-rw.html` (engine thật, act giả).

## Đợt 528 (15/10/2026) — sửa ở màn chọn Options
- Xưởng xe đè màn chọn (thiếu `.aw-rw-host` trong luật giấu `core/words-picker.css`) · game kẹt 5 đèn đỏ (`ui.host.options` không gọi `ov.onClose` khi bảng nhúng màn chọn đang mở ⇒ `G.paused` mãi). Chi tiết GHI CHU DU AN Đợt 528.

## Đợt 527 (15/10/2026) — đưa lên AWord (myGame mẫu 3o)
- Chép: `python tools/chep-racing-words.py` ⇒ `3d/` (gói nhúng `rw-3o.js` + lõi + CSS), `xe3d/` (13 xe, BỎ H3 Bugatti Divo CC-BY-NC), `sfx/` (29 tiếng + NGUON AM THANH.md). ⛔ Không sửa tay 3d/.
  Sửa game: làm ở myGame (mẫu mới = tên mới, vd 3p), thầy OK ⇒ đổi `GOC` trong công cụ + `GAME` / `CSS` trong racing-words.js ⇒ chạy lại công cụ.
- Options (khoá PHẲNG trong activity.options): `srSameQ` (cùng câu hỏi 2 đội) · `srMsMax` 1–10 · `srSteps` 3–20 (độ dài đường = số câu) · `srLaps` 0 = tự động, 1–6 · `srRamps`.
- iPad: `rw-pad-signal.js` (rwpad_host / rwpad_pad0 / rwpad_pad1, kind `racingwords-pad`) · `ipad_now` game `racingwords` · pad.js `showRW`.
- Xe 2 đội nhớ THEO MÁY (localStorage `speedrun.cars`), chọn ở màn chờ xưởng. Âm lượng Effect/Music nhớ theo máy (`racingwords.sound`).
- Bàn thử: `scratch/dot527-rw.html?padsig=local` + `pad.html?padsig=local` (tab khác).
