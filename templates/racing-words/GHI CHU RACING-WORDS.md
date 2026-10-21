# GHI CHÚ RACING WORDS (template `racing_words`)

Đua siêu xe 3D 2 đội trên bộ câu hỏi kiểu Quiz. THIẾT KẾ ở kho myGame `speed-run/` (tên cũ SPEED RUN) — hồ sơ đầy đủ từng mẫu: `myGame/speed-run/NGHIEN CUU GAMEPLAY.md`.

## Đợt 566 (21/10/2026) — TRANG THỬ ẨN myGame 5j-e — hết rung sau kick, đạn Roadster qua đầu xe (sr3d-dammo-5j), cảnh quanh Roadster (sr3d-world-5j), vạch lửa loang lổ, bỏ biển gốc. Template thật KHÔNG đổi.

## Đợt 565 (21/10/2026) — TRANG THỬ ẨN myGame 5j-d — Roadster kick (bật thrust giữa trời), hạ cánh phụt lửa, BOOST đường có lửa, khói hông giữ cân 1/2, tâm bắn theo tốc độ xe; padui-5j chép lại (nút TAKE OFF lúc đang hạ). Template thật KHÔNG đổi.

## Đợt 564 (21/10/2026) — TRANG THỬ ẨN myGame 5j-c — Roadster đứng sàn trong xưởng, bảng màu Roadster (dset.carCol), bánh quay quanh trục thật, nhảy dốc / dốc xoắn như xe thường. Template thật KHÔNG đổi.

## Đợt 563 (21/10/2026) — TRANG THỬ ẨN myGame 5j-b — Roadster trong xưởng (`3d/sr3d-intro-5j.js`, rw-5j nhập intro này) + sửa khói / nút cất-hạ cánh. Template thật KHÔNG đổi.

## Đợt 562 (21/10/2026) — TRANG THỬ ẨN myGame 5j (XE BAY ROADSTER) — template thật KHÔNG đổi
- `lab/racing-xebay.html` + `lab/racing-xebay-pad.html`, kênh `rw-lab-signal.js` (rwlab_*). File 5j chép vào `3d/` + `drone3d/flycar-F296.glb`. Hồ sơ: myGame `speed-run/HO SO BAN GIAO RACING WORDS.md` mục 5j.

## Đợt 558 (20/10/2026) — myGame 5i: VẠCH LỬA DRONE + ⚙ Settings ▸ Boost + sửa tab Driver
- GOC `rw-5i.js` · lõi `sr3d-5i.js` (+ `rw-bloss-5i.js` hiệu ứng boost mất, tự chèn CSS) · iPad `sr3d-padui-5i.js` (bọc padui-5g) + padlink-5e giữ nguyên · CSS thêm `rw-5i.css` sau rw-5h.css.
- Cài đặt Boost theo MÁY (`racingwords.boost.v1`), không phải Options của act. Muốn theo act ⇒ chuyển thành khoá `sr*` trong RW_DEF / RW_FLAT.
- Luật mới khi sửa lõi: nút tab Settings gắn lệnh qua `nav [data-tab]` (khung `.rw-c` cũng có data-tab) · tên trong lõi đã dùng: `FL` (máy quay), API `fire` (bắn) ⇒ vạch lửa = `FIRE_L` / getter `fireL`.

## Đợt 556 (19/10/2026) — myGame 5h: TỐI ƯU TOMKO khi bật drone
- GOC `rw-5h.js` · lõi `sr3d-5h.js` (xưởng `sr3d-intro-5f.js`, iPad padui-5g / padlink-5e giữ nguyên) · CSS thêm `rw-5h.css` sau rw-5f.css.
- Luật mới khi sửa lõi: vật liệu `transparent` + DoubleSide phải `forceSinglePass` TRƯỚC compileAsync (`singlePass()`); đổi độ nét KHÔNG gọi `fit(true)`; không đọc offsetWidth/clientWidth trong vòng khung.

## Đợt 554 (19/10/2026) — myGame 5e → 5g: 2 DRONE (iPad thứ 4) — CHỐT
- GOC `rw-5f.js` · lõi `sr3d-5f.js` · xưởng `sr3d-intro-5f.js` · đạn `sr3d-dammo-5e.js` (chủ đạn) · iPad `sr3d-padui-5g.js` + `sr3d-padlink-5e.js` (4 chỗ: t = 0 · 1 đội, 2 · 3 drone) · ảnh `anh-pad/`.
- CSS nạp thêm sau rw-4y.css: rw-5e · rw-5f. Kênh bắt tay + `rwpad_pad3`; pad.js `?t=3` ⇒ vai DRONE 2 (cờ `aw.rwDrone` = "3").
- Trang thử ẩn lab/racing-drone* đã xoá.

## Đợt 553 (19/10/2026) — myGame 4j → 5d: DRONE (iPad thứ 3) — CHỐT
- GOC `rw-5d.js` · lõi `sr3d-5d.js` · đạn `sr3d-dammo-4w.js` · mẫu drone `sr3d-drone3d-4p.js` + `drone3d/*.glb` · icon `rw-icons-4x.js` · iPad `sr3d-padui-5c.js` + `sr3d-padlink-5a.js` (cả đầu game lẫn pad.js).
- CSS nạp thêm (đúng thứ tự, sau rw-4j.css): rw-4k · rw-4l · rw-4o · rw-4r · rw-4w · rw-4y. Kênh bắt tay + `rwpad_pad2`; pad.js `?t=2` ⇒ vai DRONE (cờ riêng `aw.rwDrone`).
- Tính năng (đủ ở hồ sơ myGame mục 0): cột drone giữa · 5 mẫu drone · tâm ngắm lục giác HUD (tay hoàn toàn, Auto target tuỳ chọn) · đạn Heart / Boost / Missile ra từ bụng, dấu điểm rơi,
  vùng nổ trúng mọi xe trong vùng · icon neon · đổi tab Settings mượt · bảng kết quả nhiều hiệp (PLAY AGAIN cộng dồn) · bảng lái iPad AERO YOKE (nghiêng 4 hướng, vòng hồi chiêu, cân cả điện thoại).
- Việc chờ: 2 drone (mỗi đội 1 drone).

## Đợt 551 (18/10/2026) — myGame 4g → 4j
- GOC `rw-4j.js` · lõi `sr3d-4j.js` · intro `sr3d-intro-4h.js` + xe `sr3d-car-4h.js` (CÙNG mô-đun) · tên lửa `sr3d-missile-4i.js` · iPad `sr3d-padui-4j.js` + `sr3d-padlink-4j.js` (pad.js), đầu game `sr3d-padlink-4f.js`.
- CSS nạp thêm (đúng thứ tự) rw-4g · rw-4h · rw-4i · rw-4j-fb (thẻ nút bắn — iPad cũng nạp qua pad.js) · rw-4j.
- Màn chờ: `showLoader3d({ pace: { create: createLoadPace, key: "rw" } })` + `onProgress` ⇒ `ld.mark` (chặng cars · race · studio · frame). ⛔ Đổi module / tiếng / xe ⇒ đo lại load-files.js.
- Tin iPad "i:": kmh,cells,ms,alarm,phase,nitro,dmg,dmgT,noaim,k/n (chuỗi đúng). Thanh DAMAGE + nút bắn iPad chỉ khi nối THẲNG.
- Bàn thử worktree: launch `aword-dot551` (scratch/srv551.mjs, cổng 5651) + `scratch/dot543-pct.html?t=racing-words`.

## Đợt 539 (16/10/2026) — khoá đội iPad
- Đội có CHỦ = mã máy iPad (`rwpad.dev`), host ghi `u0`/`u1`; máy khác bị bỏ qua + tấm "already has an iPad"; pad.js màn chọn đội dùng `watchTeams` ⇒ `setBusy`.
- Nhả: chủ bấm ◀ về màn chọn đội (ghi `left`) hoặc mất > 8 s. Bàn thử nhiều iPad cùng trình duyệt: `pad.html?padsig=local&dev=a` / `dev=b`.

## Đợt 538 (16/10/2026) — myGame mẫu 4f: iPad nối trước intro · giữ kết nối · tự nối lại · mốc nghiêng tự lấy
- GOC `rw-4f.js` (+ `rw-4f.css`), iPad `sr3d-padlink-4f.js` + `sr3d-padui-4f.js` (pad.js nạp). Lõi vẫn `sr3d-4e.js`, intro `sr3d-intro-4e.js`.
- ⛔ Đường nối iPad là MỘT bản cho cả trang (`PADLINK` trong racing-words.js) — đừng tạo createPadHost trong mount nữa (Apply dựng lại game ⇒ iPad phải nối lại = lỗi Đợt 537 trở về).
  Game chỉ attach/detach; hết người dùng ⇒ nhả claim ngay, `close()` sau 30 s. Mở sớm ở startScreen (chế độ iPad nhớ trên máy ≠ Off).
- Cổng START ở xưởng (chế độ Drive on iPad): 2 iPad nối THẲNG + đã bẻ thử trái/phải. Lối thoát khi iPad hỏng: ⚙ ▸ iPad đổi chế độ khác.
- "SLOW" còn xảy ra ⇒ đọc dòng chẩn đoán dưới thẻ đội (hồ sơ myGame mục 40 có cách đọc). iPad tự thử lại nấc 5→20 s; nút Reconnect bắt bắt tay lại ngay.
- Bàn thử `scratch/dot538-rw.html?padsig=local` + `pad.html?padsig=local&t=0|1` (tab iPad phải ở trước khi giả nghiêng `__padui.tiltDebug(deg)` — tab nền dừng rAF).

## Đợt 537 (16/10/2026) — myGame mẫu 4e: Settings mọi nơi + tạm dừng · mặc định mới · bay xa · nghiêng đúng chiều · màn chờ ảnh riêng
- GOC `rw-4e.js` (lõi `sr3d-4e.js`, intro `sr3d-intro-4e.js` — vẫn xe `sr3d-car-4b.js` chung với lõi). CSS thêm `rw-4e.css` (nạp sau rw-4d.css): bảng Settings z 60 nổi trên intro.
- Mặc định Settings: Drive on iPad + Tilt · Cockpit · Sky view Off · Traffic Off; khoá máy đổi `.v2` (`racingwords.steer.v2 · view.v2 · sky.v2 · traffic.v2 · padMode.v2`) — chế độ iPad nhớ theo máy.
- Màn chờ: `rw-loading.webp` (ảnh gốc ở myGame `speed-run/rw-loading.webp`) qua `showLoader3d({ theme: "race", bg })`. Đổi ảnh: chụp lại ở myGame (hồ sơ mục 39) rồi chép đè.
- Options: `lockRace()` làm mờ Length · Track length · Laps (Race ≠ Length) và Time (Race ≠ Time).
- Bàn thử `scratch/dot537-rw.html` (+ `?padsig=local` khi thử iPad). Hồ sơ myGame mục 39.

## Đợt 535 (16/10/2026) — myGame mẫu 4d: 5 đợt sau 3y
- GOC `rw-4d.js` (lõi `sr3d-4d.js`, thế giới `sr3d-world-4b.js`, xe `sr3d-car-4b.js` — intro `sr3d-intro-4b.js` PHẢI cùng mô-đun xe, khác ⇒ dịch sẵn chậm 20 s), `sr3d-stunt-4b.js`
  (dốc xoắn + phần thưởng), `sr3d-traffic-4c.js` (xe khác). CSS thêm rw-3z · rw-4a · rw-4b · rw-4c · rw-4d (nạp sau rw-3r.css, đúng thứ tự).
- Options mới (khoá phẳng): srRace "len"|"time"|"words" · srLenK 1|1.5|2|3 · srTimeS 60–600 · srTwists · srPkBoost · srPkLife · srPkMissile. Đổi Race / Length / Time / Twist ⇒ game dựng lại; phần thưởng áp ngay.
- ⚙ Settings (nút bánh răng thay nút iPad): iPad · Camera (Cockpit / Chase · Sky view Auto/Off) · Race (Traffic Off / Same way / Both ways) — nhớ theo máy (`racingwords.view` · `racingwords.sky` · `racingwords.traffic`).
- Bàn thử `scratch/dot535-rw.html?padsig=local` + `pad.html?padsig=local`. Hồ sơ myGame mục 33–38.

## Đợt 534 (16/10/2026) — myGame mẫu 3y: LÁI NGHIÊNG iPAD
- GOC `rw-3y.js` (lõi `sr3d-3y.js`), GOC_THEM `sr3d-padui-3y.js` + `sr3d-padlink-3y.js` (padui-3y vẫn nạp TEAM_META từ padlink-3e ⇒ 3e còn trong 3d/). CSS giữ rw-3r.css.
- Màn lớn: phanh trái / boost phải · dấu đỉnh vô lăng máy bay giấy · nút iPad: Steering + Full lock + Smoothing (nhớ máy `racingwords.steer`) · iPad nghiêng ⇒ game làm mượt dt·22.
- iPad (pad.js showRW): `onSteer` ⇒ `setSteer`. Thiết kế từng vòng: myGame `speed-run/thiet-ke-ipad-3s…3y.html`, trang thử nghiêng `thu-nghieng-3s.html`, hồ sơ myGame mục 31–32.
- Bàn thử `scratch/dot534-rw.html?padsig=local` + `pad.html?padsig=local` (tab khác, chọn TEAM 1 sau khi màn lớn bật Drive on iPad).

## Đợt 533 (16/10/2026) — myGame mẫu 3r: MƯỢT TUYỆT ĐỐI TRÊN TOMKO + sửa lỗi khung không được vẽ
- GOC `rw-3r.js`, CSS `rw-3r.css`. File 3r: rw · sr3d · sr3d-intro · sr3d-car (nén vật liệu) · sr3d-world (thứ tự vẽ) · sr3d-missile (pool cột sáng) · sr3d-autores-3r.
- Đo act 572 trong myActivity (khung vẽ thật): xưởng 60 · phim 59 · 5 đèn 60 · đua 59,7 · 0 lỗi · 0 dịch shader giữa trận. Chi tiết GHI CHU DU AN Đợt 533 + myGame NGHIEN CUU mục 30.
- Sổ tay tối ưu + bộ đo: myGame `HUONG DAN TOI UU GAME 3D.md`, `tools/do-game-3d/`.
- ⚠️ Đo game 3D: đếm `composer.render` thật + bắt lỗi JS — nhịp rAF vẫn 60 khi khung bị lỗi không vẽ (lỗi `dist` của 3q).

## Đợt 531 (15/10/2026) — myGame mẫu 3q (Fight options · cảnh xa · 35 km/h) + chỉ có Fight
- GOC `rw-3q.js`, CSS `rw-3q.css`. Khoá phẳng mới: srLives · srMsDmg · srTie (0 = ∞) · srMissWait (−1 = ∞) · srMsStreak · srMsMax 0–10. Cờ `fightOnly` + `boxMode` + `ownFight`.
- Bàn thử `scratch/dot531-rw.html` (engine thật + preflight + act có sẵn Options). Chi tiết GHI CHU DU AN Đợt 531.

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
