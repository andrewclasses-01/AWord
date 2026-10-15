# GHI CHÚ RACING WORDS (template `racing_words`)

Đua siêu xe 3D 2 đội trên bộ câu hỏi kiểu Quiz. THIẾT KẾ ở kho myGame `speed-run/` (tên cũ SPEED RUN) — hồ sơ đầy đủ từng mẫu: `myGame/speed-run/NGHIEN CUU GAMEPLAY.md`.

## Đợt 527 (15/10/2026) — đưa lên AWord (myGame mẫu 3o)
- Chép: `python tools/chep-racing-words.py` ⇒ `3d/` (gói nhúng `rw-3o.js` + lõi + CSS), `xe3d/` (13 xe, BỎ H3 Bugatti Divo CC-BY-NC), `sfx/` (29 tiếng + NGUON AM THANH.md). ⛔ Không sửa tay 3d/.
  Sửa game: làm ở myGame (mẫu mới = tên mới, vd 3p), thầy OK ⇒ đổi `GOC` trong công cụ + `GAME` / `CSS` trong racing-words.js ⇒ chạy lại công cụ.
- Options (khoá PHẲNG trong activity.options): `srSameQ` (cùng câu hỏi 2 đội) · `srMsMax` 1–10 · `srSteps` 3–20 (độ dài đường = số câu) · `srLaps` 0 = tự động, 1–6 · `srRamps`.
- iPad: `rw-pad-signal.js` (rwpad_host / rwpad_pad0 / rwpad_pad1, kind `racingwords-pad`) · `ipad_now` game `racingwords` · pad.js `showRW`.
- Xe 2 đội nhớ THEO MÁY (localStorage `speedrun.cars`), chọn ở màn chờ xưởng. Âm lượng Effect/Music nhớ theo máy (`racingwords.sound`).
- Bàn thử: `scratch/dot527-rw.html?padsig=local` + `pad.html?padsig=local` (tab khác).
