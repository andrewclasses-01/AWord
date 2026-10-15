// RACING WORDS — LÕI MẪU 3r (16/10/2026) = sr3d-3q.js tối ưu MƯỢT cho TOMKO (Quadro T2000 4 GB, màn 4K DPR 1,25, myActivity trần __awMaxPR 1).
//   Đo act 572 thật trong myActivity (thầy: "tối ưu tuyệt đối độ mượt, chấp nhận bỏ khử răng cưa / giảm đồ hoạ"): trận 58,6 fps nhưng 17 lần dịch
//   shader giữa trận + độ nét nhấp nhả 9 lần/ván + MSAA bật lại giữa trận (khựng ~200 ms). Sửa:
//   · MSAA TẮT HẲN (render target samples 0, bộ tự chỉnh không còn nấc MSAA ⇒ không bao giờ cấp lại khung đệm vì MSAA).
//   · tên lửa: vật liệu cột sáng dùng lại (sr3d-missile-3r) ⇒ hết dịch shader mỗi phát bắn.
//   · cảnh: đường / xe / cây vẽ trước, đất – biển – trời sau (sr3d-world-3r) ⇒ early-z bỏ phần shader nhiễu bị che.
//   · pass nhoè hướng tâm TẮT khi cả 2 nửa không nhoè (tiết kiệm 1 lượt đọc–ghi toàn màn).
//   · bộ tự chỉnh độ nét sr3d-autores-3r (thử nâng sau ~20 s êm), khoá nhớ rw-3r. HUD: bỏ filter / animation đắt (rw-3r.css).
// ---- gốc 3q ----
// RACING WORDS — LÕI MẪU 3q (15/10/2026) = sr3d-3p.js + (thầy, sau khi chơi 3p):
//   · CẢNH XA ĐÚNG VẬT LÝ: đường cong theo tiếp tuyến ngoài 150 m (sr3d-world-3q.js bendQ) ⇒ núi chỉ xoay đúng góc xe quay; trời xoay cùng;
//     độ cong vào dần theo GIÂY THẬT (bản cũ lerp 0,08 MỖI KHUNG ⇒ máy nhanh/chậm khác nhau)
//   · tốc độ thường (không boost) 35 km/h (VBASE 9,72 m/s; bù xe sau +5 m/s) · DƯỚI 40 km/h lên cầu nhảy ⇒ chỉ "rơi" qua mép (t.low): không camera
//     bay, không lộn vòng, không +20 % tốc độ; chạm đất rung màn mạnh hơn
//   · FIGHT kiểu Rocket Race (thầy chốt 15/10): Same = THEO LƯỢT — 2 đội cùng câu cùng lúc; đội ĐÚNG trước ⇒ đội kia còn TIME DELAY giây
//     (tieWait; 0,1 = khoá ngay; ∞ = chờ); đội SAI trước ⇒ đội kia còn MISS WAIT giây (missWait); xong cả hai / hết giờ ⇒ cả 2 sang câu mới.
//     Different giữ như cũ (mỗi đội nhịp riêng). LIVES (0 = tắt): sai −1, trúng tên lửa −1, hết ⇒ xe NỔ, đội kia thắng; vạch năng lượng mảnh
//     ở cột kính mép ngoài mỗi nửa. MISSILE DAMAGES 1–5 (msDmg): xoay + đứng yên ≈ L giây, khói đen che kính 0,8 + 0,75·L giây.
//     Missile streak (streak) · Missiles max (msMax, 0 = không tên lửa).
// ---- gốc 3p ----
// RACING WORDS — LÕI MẪU 3p (15/10/2026, thầy: "khá lag — tham khảo cách tối ưu của Train Rush") = sr3d-3o.js + DỊCH SẴN SHADER:
//   đo Chrome thật (RTX 4060): bấm START ⇒ ĐỨNG HÌNH 4,3 s rồi 5,3 s (shader 4 ⇒ 78 dịch ngay khung đầu của trận), giữa trận thêm cú khựng
//   ~200 ms mỗi lần tên lửa / nổ / vết cháy đầu tiên (vật liệu mới; dispose xong lần sau lại dịch lại). Như TRAIN RUSH 1am / STAR LOOT 2p:
//   · prewarm(): lúc đang ở xưởng (game hold) — sinh MẪU tên lửa + nổ + vết cháy, renderer.compileAsync cả cảnh (không chặn khung),
//     rồi vẽ 1 khung ẩn với mọi lớp camera (dịch nốt biến thể cắt mũi xe + hậu kỳ), dọn mẫu · pinPrograms() mỗi 30 khung giữ shader sống
//   · xe gộp mảnh + bỏ kính transmission ở sr3d-car-3p.js (1.092 ⇒ ~430 lệnh vẽ/khung)
// ---- gốc 3o ----
// RACING WORDS — LÕI MẪU 3o (15/10/2026) = sr3d-3n.js + CHỖ NỐI AWORD (thầy "đưa lên AWord, sử dụng options của AWord" ⇒ "ok build", khuôn STAR LOOT 2o):
//   · createSpeedRun({ …, host }): host = cầu AWord (ui.host): options(ov) · listActs() / openAct(id) · templates() / switchTemplate(t) · home()
//   · nút Options ⇒ host.options({layer, top, onClose}) = bảng Options THẬT của AWord gắn trên game, game DỪNG tới khi bảng đóng;
//     Apply ⇒ AWord gọi api.setOptions(o): cùng/khác câu hỏi + số tên lửa áp NGAY; độ dài đường / số vòng / cầu nhảy đổi ⇒ trả false (AWord dựng lại)
//   · có host ⇒ KHÔNG đọc/ghi Options riêng (speedrun.opts) + iPad mặc định Off, không nhớ (AWord Đợt 514) · nút Thư mục = act cùng thư mục
//   · MENU ▸ CHANGE TEMPLATE = danh sách template của AWord + LIBRARY · phím Esc gỡ khi destroy
// ---- gốc 3n ----
// RACING WORDS — LÕI MẪU 3n (15/10/2026) = sr3d-3m.js + hold(bật/tắt) để INTRO xưởng (sr3d-intro-3n.js) chiếu thì game NGỪNG VẼ (đỡ 2 khung WebGL cùng chạy) + báo onEvent("menu") khi về màn chờ.
// ---- gốc 3m ----
// RACING WORDS (tên cũ SPEED RUN) — LÕI MẪU 3m (15/10/2026) = sr3d-3l.js, chỉ ĐỔI TÊN GAME hiển thị thành RACING WORDS (thầy 15/10). Mã/khóa lưu (speedrun.*) giữ nguyên.
// SPEED RUN 3D — LÕI MẪU 3l (15/10/2026) = sr3d-3k.js, chỉ đổi xe sang sr3d-car-3l.js (LỬA PÔ THẬT). ---- gốc 3k ----
// =============================================================
// SPEED RUN 3D — LÕI MẪU 3k (15/10/2026) = sr3d-3j.js + thầy chỉnh (15/10):
//   · hiệu ứng nút trả lời: ĐÚNG + NHANH ⇒ nút BÙNG NỔ sáng (chớp + vòng sóng + tia lửa); đúng thường ⇒ toả sáng; SAI ⇒ KHÓI xịt quanh nút + nút rung,
//     xe GIẬT LẮC + hơi MẤT LÁI (slip: văng ngang, lò xo xoay thân, lắc nghiêng)
//   · ĐÚNG chỉ nạp vạch năng lượng trong bàn đạp BOOST — tăng tốc CHỈ khi bấm bàn đạp (xe tự lái KHÔNG tự đạp boost nữa, trừ chế độ "Tự chơi" của bàn thử)
//   · MENU ▸ START AGAIN ⇒ về màn chờ START (không vào đua ngay)
//   · bánh luôn lăn (sr3d-car-3k.js) · xe trước PHANH gấp ngay trước mặt ⇒ xe sau hơi lệch, mất lái nhẹ
//   · màn chờ: ống xả thỉnh thoảng xịt lửa ("pô nổ") + chút khói
//   · khúc cua: xe có LỰC VĂNG ra ngoài (theo độ cong bản đồ × tốc độ) — xe đi thẳng, người lái phải chỉnh tay lái; trợ lái chỉ đỡ 20 %,
//     tự lái (không ai cầm lái) cũng chỉ bám làn nhẹ ⇒ xe trôi ra ngoài khúc cua một chút
// ---- gốc mẫu 3j ----
// SPEED RUN 3D — LÕI MẪU 3j (15/10/2026) = sr3d-3i.js + thầy chỉnh (15/10):
//   · BUỒNG LÁI THẬT: mũi xe trong góc nhìn ghế lái = mũi của CHÍNH xe đang chọn (car.hoodView, cắt ở chân kính) + mắt tài xế theo từng xe (car.eye/look)
//   · bấm TÊN XE ở màn chờ ⇒ sổ danh sách 14 xe (2 nhóm) để chọn nhanh
//   · biển số ANDREW TEAM (sr3d-car-3j.js) · nút CONTROLS không tự đóng (chỉ đóng khi bấm lại), bỏ nút Full screen
//   · nút MENU = bảng MENU giữa màn như Rocket Race (RESUME vàng · START AGAIN · CHANGE CARS · CHANGE TEMPLATE), game TẠM DỪNG khi mở
//   · tốc độ nền −30 % (VBASE 22 → 15,4 m/s, VMIN 12 → 8,4) · đường dài hơn (mặc định 1 vòng / 6 đoạn) + bản đồ nhiều kiểu cua hơn (34 điểm: chữ S, kẹp tóc, chicane)
//   · tiếp đất: thân xe CHÔNG CHÊNH (lắc dần tắt) + VẾT LỐP trên đường (cả khi bị bắn xoay / phanh gấp)
//   · trúng tên lửa: CHÁY tại chỗ trúng ~2,6 s rồi để lại vết CHÁY ĐEN loang lổ trên thân tới hết trận
// ---- gốc mẫu 3i ----
// SPEED RUN 3D — LÕI MẪU 3i (15/10/2026) = sr3d-3h.js + XE 3D THẬT (14 xe Sketchfab thầy chọn, sr3d-car-3i.js / sr3d-xe3d.js):
//   · thầy: "Đưa cả 14 xe vào game, mỗi đội tự chọn xe trước khi đua" ⇒ màn chờ: mỗi nửa màn có ◀ tên xe ▶ (bấm, hoặc phím A/D đội 1, ←/→ đội 2);
//     máy quay màn chờ vốn quay quanh xe của đội ⇒ thành phòng trưng bày luôn. Xe sơn màu đội, nhớ lựa chọn (localStorage speedrun.cars).
//   · xe đổi khi đang ở màn chờ: tải (prepXe) rồi thay riêng xe đội đó (rebuildCar) — bệ tên lửa, capô, bóng dựng lại theo kích thước xe mới.
//   · va chạm 2 xe dùng kích thước THẬT từng xe (trước: lấy xe đội 1 cho cả 2).
// ---- gốc mẫu 3h ----
// SPEED RUN 3D — LÕI MẪU 3h (15/10/2026) = sr3d-3g.js + vô lăng có chữ ATEAM LED màu đội + góc đáy bo tròn (sr3d-dash-3h.js). CSS dùng sr3d-3g.css.
// ---- gốc mẫu 3g ----
// SPEED RUN 3D — LÕI MẪU 3g (15/10/2026) = sr3d-3f.js + vô lăng ĐÁY PHẲNG kiểu Thrustmaster T248 (sr3d-dash-3g.js) — màn iPad bố cục B (sr3d-padui-3g.js, pad-3g.html).
// ---- gốc mẫu 3f ----
// SPEED RUN 3D — LÕI MẪU 3f (15/10/2026) = sr3d-3e.js, BỎ HẲN XOAY NGANG TRÊN KHÔNG (thầy 15/10: "xe khi phóng lên race ramp có hiện tượng xoay ngang
//   trên không trung, tôi không thích" — đó là tính năng: xe tự lái tự bấm phanh lúc bay ở 60 % số lần nhảy (đo 13/18) + phanh trên không = Flat Spin).
//   ⇒ tự lái không tự xoay nữa · PHANH trên không không còn Flat Spin; muốn lấy boost thì PHANH + LÁI = lộn theo TRỤC DỌC (Barrel Roll)
//   · ◀ ▶ trên không chỉ nghiêng thân (roll), không còn lượn hướng (yaw) · CSS / iPad dùng của 3e (pad-3e.html, kênh srpad3e).
// ---- gốc mẫu 3e ----
// SPEED RUN 3D — LÕI MẪU 3e (15/10/2026) — chép từ sr3d-3d.js, thầy chỉnh tiếp (15/10):
//   · khói đen khi trúng che LÂU hơn (CSS 3,6 s) · tên lửa bay CHẬM hơn (sr3d-missile-3e.js, 2,45 s)
//   · bàn đạp ga dài lên trên (thanh kim loại còn ~1/3), phanh dài hơn, cả 2 HẸP lại; khung đáp án hẹp lại, cách bàn đạp một khoảng (CSS + dash-3e)
//   · NÚT TÊN LỬA: bấm ⇒ CHÍNH quả trong nút bay vút lên; nếu còn quả trong kho: 1 quả chờ (icon nhỏ) THỤT xuống mép dưới khung đáp án và
//     1 quả từ DƯỚI nút trồi lên vào đúng ô vừa trống (= nạp từ kho lên vị trí sẵn sàng). Nút chứa tối đa 2 quả sẵn sàng; icon chờ = số còn lại (≤ 4 + "+x").
//   · vệt sáng tay vô lăng làm lại (dash-3e) · chấm chuỗi đúng cân giữa ô của nó
//   · vô lăng CHỈ nhận bấm trong vòng tròn vô lăng (+12 % ra ngoài), bấm xa hơn không tính
// ---- gốc mẫu 3d ----
// SPEED RUN 3D — LÕI MẪU 3d (15/10/2026) — chép từ sr3d-3c.js, thầy chỉnh tiếp (15/10):
//   · bỏ chữ BOOST/BRAKE dưới bàn đạp (bàn đạp dài ra), 2 bàn đạp rộng bằng nhau + tay đòn giống nhau (sr3d-dash-3d.js), sát vô lăng hơn,
//     chừa khoảng trống ở mép giữa 2 nửa màn để phanh đội 1 / ga đội 2 không sát nhau
//   · cung sáng vô lăng mờ dần 2 đầu (dash-3d)
//   · NÚT TÊN LỬA ở GIỮA hàng dưới bảng đáp án, dài; tên lửa chờ sát MÉP MÀN, chấm chuỗi đúng ở phía còn lại; icon 2 quả đứng song song
//   · phi lên dốc mà CHỈ MỘT PHẦN xe trên dốc (bánh 1 bên) ⇒ xe nghiêng, rời mép thì LỘN 1 VÒNG QUANH TRỤC DỌC (đầu–đuôi xe, như barrel roll thật)
//     rồi tiếp đất — cùng hiệu ứng bay như qua dốc thường (máy quay ngoài, nhoè, vệt gió…), KHÔNG xoay vòng quanh trục đứng như khi bị bắn
//   · bị TRÚNG tên lửa: xe xoay + chậm (như 3c) + KHÓI ĐEN mù mịt phía trước, che tầm nhìn nửa màn đội đó ~2 s (lớp .sr-smoke + hạt khói đen)
// ---- gốc mẫu 3c ----
// SPEED RUN 3D — LÕI MẪU 3c (15/10/2026) — chép từ sr3d-3b.js, thầy chỉnh tiếp (15/10):
//   · BOOST = NĂNG LƯỢNG TÍCH TRỮ: trả lời ĐÚNG không tự tăng tốc mà nạp thanh boost (nhanh tay nạp nhiều hơn: 0,6–1,2 ô); SAI ⇒ thanh boost bị xịt
//     0,6 ô + xe xì KHÓI ĐEN + chậm lại một chút. Giữ bàn đạp BOOST ⇒ dùng dần năng lượng để vọt (VBOOST); xe luôn chạy tốc độ nền VBASE.
//     Xoay 360 trên không cũng nạp vào thanh boost (gộp Nitro cũ vào đây).
//   · Leo dốc cầu nhảy KHÔNG đạp boost ⇒ bị trọng lực hãm như thật; có boost mới lên dốc hiệu quả.
//   · Húc đuôi xe đang phanh/chậm phía trước ⇒ xe trước được ĐẨY vọt lên (giữ đà ~1,3 s), xe sau khựng lại — khuyến khích tấn công; tự lái KHÔNG tự tránh nữa.
//   · Câu hỏi: mặc định 2 đội CÙNG bộ câu (cùng thứ tự, cùng thứ tự đáp án); đổi trong Options (hàng nút).
//   · Bảng iPad nhỏ, giữa màn; chọn chế độ ⇒ hỏi xác nhận ⇒ OK là đóng; đổi chế độ không dừng trận.
//   · Máy quay lúc bay lên dốc / về ghế lái NHANH hơn. Điều khiển iPad (chế độ đua trên iPad) hiện lên game cả lúc chờ.
//   · Tên lửa mới (sr3d-missile-3c.js) mảnh, nhỏ, bay nhanh hơn, quỹ đạo leo–bổ nhào; CÁNH TAY ROBOT trên nóc xe nâng giá 2 quả cạnh nhau (bắn quả nào
//     thì quả mới nạp lên chỗ đó). Mỗi lần trúng tên lửa: xoay/văng/nảy/nghiêng NGẪU NHIÊN khác nhau.
//   · Nút tên lửa chỉ có icon 2 quả chéo, bấm ⇒ 1 quả vút lên trong nút; tên lửa chờ dựng đứng, tối đa 4 + "+x" (số tối đa = Options).
//   · Vô lăng sáng 1 cung 1/4 vành bên đang bấm; bàn đạp kiểu treo (trên cố định, dưới lún) — sr3d-dash-3c.js.
//   · Về đích: SLOW MOTION + máy quay điện ảnh (1 nửa quay vòng quanh xe thắng, 1 nửa đặt thấp sau cổng đích) + khung đen điện ảnh.
// ---- gốc mẫu 3b ----
// SPEED RUN 3D — LÕI MẪU 3b (15/10/2026) — chép từ sr3d-3.js (mẫu 3 "đua vòng"), thầy chỉnh tiếp (15/10):
//   · BOOST (bàn đạp GA) bên TRÁI vô lăng, BRAKE (bàn đạp PHANH) bên PHẢI — vẽ đúng hình bàn đạp thật (sr3d-dash-3b.js, dùng chung với iPad)
//   · nút Control bằng cỡ các nút khác, dải nút thấp hơn (60 px) · màn khởi động: bỏ dòng hướng dẫn, bỏ tên bộ câu hỏi, bỏ nút iPad steering,
//     thêm ANDREW STUDIO trên chữ SPEED RUN
//   · NÚT iPAD = 3 CHẾ ĐỘ (nhớ localStorage "speedrun.padMode"): 0 TẮT iPad (đua + câu hỏi + trả lời trên màn lớn) ·
//     1 TRẢ LỜI TRÊN iPAD (đua trên màn lớn; câu hỏi CHỈ trên iPad, màn lớn chỉ hiện đáp án, không bấm được) ·
//     2 ĐUA TRÊN iPAD (iPad = vô lăng + bàn đạp Y HỆT game + nút tên lửa; màn lớn hiện đủ, vô lăng/bàn đạp trên màn lớn chỉ HIỆN theo iPad).
//   Giao thức thêm (sr3d-padlink-3b.js): game → iPad "m:<chế độ>" + "Q:<json câu hỏi>" (+ ghi vào kho bắt tay làm đường dự phòng) · iPad → game "a:<đáp án>:<số câu>".
// ---- gốc mẫu 3 ----
// SPEED RUN 3D — LÕI MẪU 3 "ĐUA VÒNG" (15/10/2026)
//   1. BỎ vạch cứng giữa 2 đội: lái sang đường của nhau được, VA CHẠM thật (húc đuôi, chèn hông, ép vào rào, chắn đầu) — 2 thân xe là
//      2 hình chữ nhật xoay (SAT), xung lực bảo toàn động lượng + văng đuôi theo điểm va.
//   2. CẦU NHẢY (sr3d-fx-3.js vẽ): lực đẩy lên/tới giữ xe trên không lâu, +20 % tốc độ lúc rời mép dốc; máy quay ra NGOÀI, thấp,
//      FOV +18 %, nhoè hướng tâm + rung lúc cất cánh / đáp đất, vệt gió sau đuôi; trên không ◀ ▶ = nghiêng/lượn nhẹ, PHANH = xoay tròn
//      (phanh thẳng = Flat Spin, phanh + lái = Barrel Roll) — mỗi vòng trọn khi đáp đất được +Nitro; đáp 4 bánh song song (< 15°) =
//      PERFECT LANDING (vọt đi + toé lửa/khói), nghiêng/lật = BAD LANDING (mất đà, nảy + nổ nhỏ, văng đuôi).
//      NITRO: giữ BOOST khi thanh Nitro còn ⇒ vọt tới VNITRO (lửa xanh), không cần năng lượng.
//   3. Dải trên THẤP hơn: câu hỏi đội 1 | BẢN ĐỒ (giữa) | câu hỏi đội 2; bỏ chữ TEAM trong khung, "TEAM n" hiện GIỮA khung khi chưa có câu.
//   4. ĐƯỜNG VÒNG: bản đồ là 1 vòng khép kín, đi nhiều vòng (opt.laps, mặc định ≈ số đoạn / 4); cổng LAP n mỗi mốc vòng; cong 3D theo khúc cua bản đồ.
//   5. TỐC ĐỘ TỐI THIỂU: xe luôn chạy ≥ VMIN (trừ khi trúng tên lửa ⇒ xoay + dừng tạm / phanh); năng lượng (câu đúng) cho chạy nhanh hơn.
//      KÉO GẦN: xe sau được bù tốc, xe trước bị hãm khi cách xa ⇒ không có cảnh 1 bên dừng chết, 1 bên băng băng về đích.
//   6. HÀNG NÚT CHỨC NĂNG kiểu AWord nhưng DỒN vào 1 nút ở góc phải (bấm ⇒ các nút bung sang trái; bấm chỗ khác ⇒ thu lại).
//   7. Không iPad vẫn chơi được: nút BOOST + PHANH trên tap-lô; bấm nửa trái/phải VÔ LĂNG để lái (sáng mờ màu đội bên đang bấm).
// Bàn thử: window.__sr — start() · toMenu() · answer(team, ok) · auto(on, a0, a1) · give(team, ô) · arm(team, n) · nitro(team, k) · fire(team)
//          · drive(team, {steer,boost,brake}|null) · place(team, s, x) · step(n) · resume() · state() · camInfo() · missiles() · ramps() · fps · res · destroy()
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { EffectComposer } from "../../rocket-race/vendor/three/addons/EffectComposer.js";
import { Pass } from "../../rocket-race/vendor/three/addons/Pass.js";
import { ShaderPass } from "../../rocket-race/vendor/three/addons/ShaderPass.js";
import { UnrealBloomPass } from "../../rocket-race/vendor/three/addons/UnrealBloomPass.js";
import { OutputPass } from "../../rocket-race/vendor/three/addons/OutputPass.js";
import { RoomEnvironment } from "../../rocket-race/vendor/three/addons/RoomEnvironment.js";
import { makeCar3d } from "./sr3d-car-3r.js";
import { XE, prepXe } from "./sr3d-xe3d-3o.js";
import { createWorld, makeBend, HAZE, bendQ } from "./sr3d-world-3r.js";
import { makeAutoRes } from "./sr3d-autores-3r.js";
import { createMissiles, MS, missileGeos, buildMissile } from "./sr3d-missile-3r.js";
import { createRamps, createTrails, RadialBlurShader, RAMP, RAMP_SLOPE } from "./sr3d-fx-3c.js";
import { WHEEL_SVG, GAS_SVG, BRAKE_SVG, FIRE_ICON, FLY_HTML, reserveHTML } from "./sr3d-dash-3h.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;
const wrapPI = a => a - TAU * Math.round(a / TAU);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// mẫu 3: không còn nửa đường riêng — cả 2 xe chạy trên toàn mặt đường [−ROADX, ROADX]; lanes = làn tự lái thích
export const TEAMS = [{ name: "TEAM 1", color: "#3b8cff", lanes: [-2.4, -6.0] }, { name: "TEAM 2", color: "#ff7a00", lanes: [2.4, 6.0] }];
const ROADX = 8.3;
// m, s: VMIN 12 m/s ≈ 43 km/h (luôn chạy) · CRUISE 31 ≈ 112 · VBOOST 47 ≈ 169 · VNITRO 57 ≈ 205 · CAP = số ô năng lượng tối đa
// mẫu 3c: VBASE 22 m/s ≈ 79 km/h = tốc độ nền luôn có · BUSE = ô boost dùng mỗi giây khi giữ BOOST
export const PHYS = { SEG: 80, VBASE: 9.72, BUSE: 0.55, VMIN: 6.5, DRIFT: 3.0, ASSIST: 0.2, CRUISE: 31, VBOOST: 47, VNITRO: 57, ACC: 10, ACCB: 15, DEC: 9, HARD: 26, BRAKE: 22, LAT: 8.5, CAP: 4,
  CATCH: 25, CATCH_K: 90, GAP_MAX: 150 };                  // kéo gần: bắt đầu bù khi cách > 25 m, đủ mức ở 115 m; trần cứng 150 m
// bay: GUP = trọng lực lúc mới cất cánh (nhẹ ⇒ "lơ lửng"), G = sau đó · ROT = tốc độ xoay khi giữ phanh trên không (rad/s)
export const AIR = { BOOST: 1.2, VY0: 2.8, VYK: 0.55, GUP: 4.5, G: 10.5, LIFT_T: 0.45, ROT: 7.4, ROLL: 1.5, PERFECT: 15 * Math.PI / 180, OK: 32 * Math.PI / 180, NITRO_ROT: 0.34, NITRO_USE: 0.3 };
export const DEFAULTS = { steps: 12, laps: 0, cars: ["Y2", "H4"], bend: 0.75, streak: 3, msMax: 3, hitLoss: 1, ramps: true, sameQ: true,
  lives: 0, msDmg: 2, tieWait: 0.1, missWait: 20 };          // 3q: lives 0 = tắt · tieWait/missWait giây, Infinity = chờ mãi
const LOW_V = 40 / 3.6;                                    // 3q: dưới 40 km/h lên cầu nhảy ⇒ không bay
const SLOW_T = 2.6;                                         // giây THẬT của slow motion về đích
const EYE = new THREE.Vector3(0, 1.1, 0.25), LOOK = new THREE.Vector3(0, 0.86, -9);
const HORIZON = 0.42;
const HOOD = { z0: -0.12, z1: -0.95, y0: 0.93, y1: 0.76, w: 1.9 };

const EMPTY = new THREE.Scene();
class SplitPass extends Pass {
  constructor(fn) { super(); this.fn = fn; this.needsSwap = false; }
  render(renderer, writeBuffer, readBuffer) { this.fn(renderer, readBuffer); }
}

const IPAD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>`;
// hàng nút kiểu AWord (icon Lucide như TRAIN RUSH)
const TOOL_ICON = {
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/><path class="x" d="m16 9 6 6m0-6-6 6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  options: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h13M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/></svg>',
  ipad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M11 18.3h2"/></svg>',
  fs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
};

// bản đồ đường vòng (khung SVG 1000 × 200, chạy THEO chiều kim đồng hồ ⇒ cua phải là chính): điểm neo Catmull-Rom khép kín
// 3j: 34 điểm — dọc trên: chữ S + 2 chỗ lượn xuống; mép phải: cua rộng; dọc dưới: kẹp tóc thụt vào (750,130), chicane, cua kép về đích
const MAP_PTS = [[80, 120], [110, 60], [170, 30], [240, 40], [280, 80], [330, 95], [380, 60], [420, 30], [500, 28], [560, 50], [590, 90], [630, 105], [680, 80], [720, 40], [800, 28], [880, 36],
  [940, 70], [950, 120], [915, 165], [850, 178], [790, 160], [750, 130], [700, 140], [670, 175], [600, 182], [530, 165], [470, 140], [420, 150], [380, 178], [300, 182], [220, 170], [170, 150], [120, 165], [85, 150]];

export function createSpeedRun({ mount, bar = null, questions, title = "RACING WORDS", options = {}, remote = null, host = null, onEvent = () => {} }) {
  const opt = { ...DEFAULTS, ...options };
  const OPT_KEY = "speedrun.opts";
  if (!host) try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || "{}"); if (typeof o.sameQ === "boolean" && options.sameQ == null) opt.sameQ = o.sameQ; if (o.msMax >= 1 && options.msMax == null) opt.msMax = Math.min(10, o.msMax | 0); } catch (e) { /* */ }
  const L = clamp(opt.steps | 0, 3, 20), SEG = PHYS.SEG, FIN = L * SEG;
  const LAPS = clamp(opt.laps > 0 ? opt.laps | 0 : Math.max(1, Math.round(L / 6)), 1, 6), LAP = FIN / LAPS;   // 3j: vòng dài hơn (12 đoạn ⇒ 2 vòng × 480 m)

  // ---------- DOM ----------
  mount.classList.add("sr-root", "sr2", "sr3");
  const half = i => `
    <div class="sr-half sr-half${i}" style="--team:${TEAMS[i].color}">
      <svg class="sr-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 H100 V3.2 C70 5.4 30 5.4 0 3.2 Z" class="roof"/>
        <path d="M0 0 L8.5 0 L3.2 100 L0 100 Z" class="pil"/><path d="M100 0 L91.5 0 L96.8 100 L100 100 Z" class="pil"/>
        <path d="M8.5 0 L3.2 100" class="edge"/><path d="M91.5 0 L96.8 100" class="edge"/>
      </svg>
      <div class="sr-speed"></div>
      <div class="sr-lb"><i></i><i></i></div>
      <div class="sr-smoke"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="sr-mirror"><span class="sr-mir-dir"></span><span class="sr-mir-txt"></span></div>
      <div class="sr-tag"><b>${2 - i}</b><span></span></div>
      <div class="sr-pick"><button class="sr-pick-b" data-d="-1" type="button" aria-label="Previous car">◀</button><button class="sr-pick-n" type="button"><small>${TEAMS[i].name} · CHOOSE YOUR CAR</small><b></b><em></em></button><button class="sr-pick-b" data-d="1" type="button" aria-label="Next car">▶</button><div class="sr-pick-list"></div></div>
      <div class="sr-alarm"><b>⚠ MISSILE</b><span class="sr-alarm-t"></span><i class="sr-alarm-bar"><em></em></i></div>
      <div class="sr-toast"></div>
      <div class="sr-dash">
        <div class="sr-console">
          <div class="sr-ans"></div>
          <div class="sr-arms"><div class="sr-ms"></div><button class="sr-fire" type="button" aria-label="Fire missile">${FIRE_ICON}</button><div class="sr-streak"><i></i><i></i><i></i></div></div>
        </div>
        <div class="sr-drive">
          <button class="sr-pedal sr-boost" type="button" aria-label="Boost">${GAS_SVG}</button>
          <div class="sr-wheelbox"><div class="sr-wheel">${WHEEL_SVG.replace(/srwg/g, "srwg" + i)}
            <div class="sr-screen"><div class="sr-src">AUTO</div><div class="sr-kmh"><span>0</span><small>km/h</small></div><div class="sr-cells"><i></i><i></i><i></i><i></i></div><div class="sr-nbar"><em></em></div></div>
          </div></div>
          <button class="sr-pedal sr-brake" type="button" aria-label="Brake">${BRAKE_SVG}</button>
        </div>
      </div>
    </div>`;
  const qbox = i => `<div class="sr-qbox sr-qbox${i}" style="--team:${TEAMS[i].color}"><b class="sr-qtag">${TEAMS[i].name}</b><div class="sr-q"></div><i class="rw-wait"><em></em></i><div class="sr-qipad">${IPAD_ICON}<span>QUESTION ON THE iPAD</span></div></div>`;
  mount.innerHTML = `
    <div class="sr-strip">
      ${qbox(0)}
      <div class="sr-map"><div class="sr-lap"></div><svg viewBox="40 10 940 180" preserveAspectRatio="xMidYMid meet"></svg><div class="sr-gap"></div></div>
      ${qbox(1)}
    </div>
    <div class="sr-stage">
      <canvas class="sr-canvas"></canvas>
      ${half(0)}${half(1)}
      <div class="sr-divider"></div>
      <div class="sr-center">
        <div class="sr-studio"><i></i><span>ANDREW STUDIO</span><i></i></div>
        <div class="sr-title">RACING WORDS</div>
        <div class="sr-menu-btns"><button class="sr-start" type="button">▶&nbsp; START</button></div>
        <div class="sr-lights"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="sr-go">GO!</div>
      </div>
      <div class="sr-banner"></div>
      <div class="sr-result"><div class="sr-res-title"></div><div class="sr-res-rows"></div><button class="sr-again" type="button">PLAY AGAIN</button></div>
      <div class="sr-pmenu" hidden><div class="sr-pmenu-box"><div class="sr-pmenu-title">MENU</div>
        <button type="button" data-m="resume" class="is-resume">RESUME</button><button type="button" data-m="again">START AGAIN</button>
        <button type="button" data-m="cars">CHANGE CARS</button><button type="button" data-m="tpl">CHANGE TEMPLATE</button><div class="sr-pmenu-note"></div></div></div>
      <div class="sr-panel" hidden><div class="sr-panel-box"><button class="sr-panel-x" type="button" aria-label="Close">✕</button><h2 class="sr-panel-h">iPad</h2><div class="sr-panel-body"></div></div></div>
    </div>`;
  const $ = s => mount.querySelector(s), $$ = s => [...mount.querySelectorAll(s)];
  const stage = $(".sr-stage"), cvs = $(".sr-canvas"), halves = [$(".sr-half0"), $(".sr-half1")], qboxes = [$(".sr-qbox0"), $(".sr-qbox1")];
  const H = halves.map((h, i) => ({
    el: h, dash: h.querySelector(".sr-dash"), ans: h.querySelector(".sr-ans"), fire: h.querySelector(".sr-fire"), ms: h.querySelector(".sr-ms"), msN: -1, streak: [...h.querySelectorAll(".sr-streak i")],
    wheel: h.querySelector(".sr-wheel"), wbox: h.querySelector(".sr-wheelbox"), kmh: h.querySelector(".sr-kmh span"), cells: [...h.querySelectorAll(".sr-cells i")], src: h.querySelector(".sr-src"),
    nbar: h.querySelector(".sr-nbar em"), nitro: h.querySelector(".sr-boost .sr-nfill"), boost: h.querySelector(".sr-boost"), brake: h.querySelector(".sr-brake"),
    smoke: h.querySelector(".sr-smoke"), slots: [...h.querySelectorAll(".sr-slot")], slotBusy: [0, 0], msHold: 0, tag: h.querySelector(".sr-tag"), tagT: h.querySelector(".sr-tag span"), mirDir: h.querySelector(".sr-mir-dir"), mirTxt: h.querySelector(".sr-mir-txt"),
    alarm: h.querySelector(".sr-alarm"), alarmT: h.querySelector(".sr-alarm-t"), alarmBar: h.querySelector(".sr-alarm-bar em"), toast: h.querySelector(".sr-toast"), q: qboxes[i].querySelector(".sr-q")
  }));

  // ---------- renderer / cảnh ----------
  const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: false, powerPreference: "high-performance" });
  renderer.debug.checkShaderErrors = false;
  renderer.localClippingEnabled = true;                     // 3j: mũi xe buồng lái = bản sao xe cắt ở chân kính
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const PR_MAX = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(PR_MAX);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HAZE, 140, 1150);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  const KEY = new THREE.Vector3(-0.45, 0.75, 0.5).normalize();
  const key = new THREE.DirectionalLight("#ffd9b3", 2.4); key.position.copy(KEY).multiplyScalar(100); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight("#ff9a5c", 1.6); rim.position.set(38, 8, -92); scene.add(rim, rim.target);
  scene.add(new THREE.HemisphereLight("#ffd7b8", "#4a5236", 0.9));
  const cams = [0, 1].map(() => new THREE.PerspectiveCamera(62, 1, 0.08, 2600));

  const U = { uBend: { value: new THREE.Vector2() }, uBendZ: { value: 0 } };
  const bend = makeBend(U);
  const world = createWorld({ scene, U, bend, keyDir: KEY });
  world.setTrack(L, SEG, LAP);
  const missiles = createMissiles({ scene, bend, U });
  const ramps = createRamps({ scene, bend });
  const trails = createTrails({ scene, bend });
  // dốc: mỗi vòng 2 dốc (≈ 1/3 và 2/3 vòng), lệch về 2 nửa đường xen kẽ ⇒ phải lái sang mới lên được dốc, dễ tranh nhau
  function layRamps() {
    const out = [];
    if (opt.ramps) for (let k = 0; k < LAPS; k++) [[0.3, k % 2 ? 4.1 : -4.1], [0.7, k % 2 ? -4.1 : 4.1]].forEach(([f, x]) => {
      const s = k * LAP + f * LAP; if (s > 90 && s < FIN - 70) out.push({ s: Math.round(s), x, w: 7 });
    });
    ramps.set(out);
  }
  layRamps();

  // ---------- xe + capô ----------
  let cars = [], hoods = [], shadows = [];
  const CARS_KEY = "speedrun.cars";
  const carIds = (opt.cars || DEFAULTS.cars).slice(0, 2).map((id, i) => XE.some(x => x.id === id) ? id : DEFAULTS.cars[i]);
  function buildCars() {
    cars.forEach(c => { scene.remove(c.rig); c.dispose(); }); hoods.forEach(h => h.dispose()); shadows.forEach(s => scene.remove(s));
    cars = TEAMS.map((tm, i) => newCar(i));
    hoods = TEAMS.map((tm, i) => makeHood(cars[i], tm.color, 3 + i));
    // bóng blob tách khỏi rig: xe bay lên thì bóng vẫn nằm trên mặt đường (nhạt + to dần theo độ cao)
    shadows = cars.map(c => { const s = c.rig.children.find(o => o.renderOrder === -1); c.rig.remove(s); scene.add(s); return s; });
  }
  function newCar(i) {
    const c = makeCar3d({ id: carIds[i], color: TEAMS[i].color, num: i + 1, bend, U });
    addPods(c, TEAMS[i].color); c.rig.traverse(o => o.layers.set(1 + i)); c.rig.rotation.order = "YXZ"; scene.add(c.rig);
    // 3r: đèn trong xe (lửa cháy ở đuôi) hiện với MỌI máy quay ⇒ máy quay nào cũng thấy cùng số đèn ⇒ mỗi vật liệu chỉ 1 bản shader (cũ 2–3 bản theo
    //   buồng lái đội 1 / đội 2 / ngoài xe ⇒ prewarm dịch gấp 2–3 lần, sót bản nào là khựng giữa trận). Ánh đèn đuôi xe mình không lọt vào khung buồng lái.
    c.rig.traverse(o => { if (o.isLight) o.layers.enableAll(); });
    return c;
  }
  // 3i: đổi xe 1 đội (màn chờ) — giữ nguyên vị trí/xoay của rig cũ
  function rebuildCar(i) {
    const old = cars[i], rot = old.rig.rotation.clone(), pos = old.rig.position.clone();
    hoods[i].dispose(); scene.remove(old.rig); scene.remove(shadows[i]); old.dispose();
    const c = newCar(i); c.rig.position.copy(pos); c.rig.rotation.copy(rot); cars[i] = c;
    hoods[i] = makeHood(c, TEAMS[i].color, 3 + i);
    const s = c.rig.children.find(o => o.renderOrder === -1); c.rig.remove(s); scene.add(s); shadows[i] = s;
  }
  let pickTok = [0, 0];
  async function setCar(i, id) {
    if (!XE.some(x => x.id === id)) return false;
    carIds[i] = id; paintPick(); saveCars();
    const my = ++pickTok[i]; H[i].el.classList.add("is-loading");
    try { await prepXe(id); } catch (e) { console.error(e); H[i].el.classList.remove("is-loading"); return false; }
    if (my !== pickTok[i] || dead) return false;
    rebuildCar(i); H[i].el.classList.remove("is-loading"); onEvent("car", { team: i, id });
    warmP = null; prewarm();                                   // 3p: xe mới = vật liệu mới ⇒ dịch sẵn lại
    return true;
  }
  function stepCar(i, d) {
    if (G.phase !== "menu" && G.phase !== "end") return;
    const k = XE.findIndex(x => x.id === carIds[i]), n = XE.length;
    setCar(i, XE[((k < 0 ? 0 : k) + d + n) % n].id);
  }
  function paintPick() {
    H.forEach((h, i) => { const x = XE.find(q => q.id === carIds[i]); if (!x) return;
      h.el.querySelector(".sr-pick-n b").textContent = x.name; h.el.querySelector(".sr-pick-n em").textContent = `${XE.indexOf(x) + 1} / ${XE.length} · ▾ ALL CARS`;
      h.el.querySelectorAll(".sr-pick-list button").forEach(b => b.classList.toggle("is-on", b.dataset.id === x.id)); });
  }
  function saveCars() { try { localStorage.setItem(CARS_KEY, JSON.stringify(carIds)); } catch (e) { /* */ } }
  // bệ phóng CÁNH TAY ROBOT trên nóc (như cánh tay trên thân tàu Rocket Race): đế + đoạn tay A (bản lề sau) + đoạn B giữ GIÁ 2 quả cạnh nhau.
  // Có tên lửa ⇒ tay nâng lên, giá chếch mũi lên; hết ⇒ tay gập nằm sát nóc. Bắn quả nào ⇒ chỗ đó trống rồi quả mới "nạp" lớn dần lên (nếu còn).
  function addPods(c, color) {
    const M = c.M, topY = Math.max(...M.top.map(p => p[1])), zr = -((M.roof[0] + M.roof[1]) / 2 - M.L / 2);
    const P = missileGeos();
    const metal = bend(new THREE.MeshStandardMaterial({ color: "#2b3037", roughness: 0.4, metalness: 0.75 })), joint = bend(new THREE.MeshStandardMaterial({ color: "#a7afb9", roughness: 0.3, metalness: 0.9 }));
    const bodyM = bend(new THREE.MeshStandardMaterial({ color: "#e9ecef", roughness: 0.3, metalness: 0.55 })), noseM = bend(new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.45, roughness: 0.3 }));
    const finM = bend(new THREE.MeshStandardMaterial({ color: "#2a2f36", roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide }));
    const gBase = new THREE.BoxGeometry(0.34, 0.05, 0.36), gSeg = new THREE.BoxGeometry(0.06, 0.06, 0.46).translate(0, 0, -0.23), gJoint = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12).rotateZ(Math.PI / 2);
    const gCradle = new THREE.BoxGeometry(0.36, 0.03, 0.5), gRail = new THREE.BoxGeometry(0.02, 0.05, 0.5);
    const L = new THREE.Group(); L.position.set(0, topY + 0.03, zr + 0.22); c.body.add(L);
    L.add(new THREE.Mesh(gBase, metal));
    const A = new THREE.Group(); A.position.set(0, 0.04, 0.14); L.add(A);
    [-1, 1].forEach(sx => { const m = new THREE.Mesh(gSeg, metal); m.position.x = sx * 0.07; A.add(m); });
    A.add(new THREE.Mesh(gJoint, joint));
    const B = new THREE.Group(); B.position.set(0, 0, -0.46); A.add(B);
    B.add(new THREE.Mesh(gJoint, joint));
    const cradle = new THREE.Group(); cradle.position.set(0, 0.04, -0.06); B.add(cradle);
    cradle.add(new THREE.Mesh(gCradle, metal)); [-0.17, 0, 0.17].forEach(x => { const r = new THREE.Mesh(gRail, metal); r.position.set(x, 0.03, 0); cradle.add(r); });
    const slots = [-0.085, 0.085].map(x => { const g = new THREE.Group(); g.position.set(x, 0.085, -0.02); g.rotation.y = Math.PI; buildMissile(g, P, bodyM, noseM, finM); g.scale.setScalar(0.62); cradle.add(g); return g; });
    const sc = [0, 0];
    let k = 0;
    c.launcher = {
      sc,
      update(dt, ms) {
        k = lerp(k, ms > 0 ? 1 : 0, 1 - Math.exp(-dt * 4));
        A.rotation.x = lerp(0.03, 0.85, ease(k)); B.rotation.x = -A.rotation.x + lerp(0, 0.16, ease(k));
        slots.forEach((g, j) => { sc[j] = lerp(sc[j], ms > j && k > 0.5 ? 1 : 0, 1 - Math.exp(-dt * 3.2)); g.visible = sc[j] > 0.02; g.scale.setScalar(0.62 * sc[j]); });
      },
      slotWorld(j, v) { slots[j].updateWorldMatrix(true, false); return slots[j].getWorldPosition(v); },
    };
    const d0 = c.dispose; c.dispose = () => { d0(); [gBase, gSeg, gJoint, gCradle, gRail].forEach(g => g.dispose()); [metal, joint, bodyM, noseM, finM].forEach(m => m.dispose()); };
  }
  function hoodTex(color) {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; const g = cv.getContext("2d");
    g.fillStyle = color; g.fillRect(0, 0, 256, 256);
    const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "rgba(0,0,0,.35)"); gr.addColorStop(0.2, "rgba(0,0,0,0)"); gr.addColorStop(0.8, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.35)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#f4f6f8"; g.fillRect(128 - 40, 0, 26, 256); g.fillRect(128 + 14, 0, 26, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  // 3j: mũi xe buồng lái = chính xe đang chọn (car.hoodView: bản sao cắt ở chân kính + tấm táp-lô tối); grp theo lớp riêng của máy quay đội đó
  function makeHood(car, color, layer) {
    const hv = car.hoodView();
    hv.grp.traverse(o => o.layers.set(layer)); car.body.add(hv.grp);
    return { grp: hv.grp, update: hv.update, dispose() { car.body.remove(hv.grp); hv.dispose(); } };
  }
  buildCars();
  H.forEach((h, i) => h.el.querySelectorAll(".sr-pick-b").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); closeLists(); stepCar(i, +b.dataset.d); })));
  // 3j: bấm TÊN XE ⇒ sổ danh sách (2 nhóm) — chọn là đóng; bấm ra ngoài cũng đóng
  const GROUPS = [["ITALIAN SUPERCARS", "Y"], ["HYPERCARS", "H"]];
  H.forEach((h, i) => {
    const list = h.el.querySelector(".sr-pick-list");
    list.innerHTML = GROUPS.map(([t, p]) => `<div class="sr-pl-h">${t}</div>` + XE.filter(x => x.id[0] === p).map(x => `<button type="button" data-id="${x.id}">${x.name}</button>`).join("")).join("");
    h.el.querySelector(".sr-pick-n").addEventListener("click", e => { e.stopPropagation(); const on = !h.el.classList.contains("is-list"); closeLists(); if (on && G.phase === "menu") { h.el.classList.add("is-list"); paintPick(); } });
    list.addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (!b) return; e.stopPropagation(); closeLists(); if (G.phase === "menu") setCar(i, b.dataset.id); });
  });
  function closeLists() { H.forEach(h => h.el.classList.remove("is-list")); }
  mount.addEventListener("pointerdown", e => { if (!e.target.closest(".sr-pick")) closeLists(); });
  paintPick();

  // ---------- hậu kỳ: 2 máy quay → 1 render target MSAA → bloom → nhoè hướng tâm → output ----------
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 0 });   // 3r: không MSAA (TOMKO: MSAA HalfFloat là phần đắt nhất)
  const composer = new EffectComposer(renderer, rt);
  let dashF = 0.3;
  composer.addPass(new SplitPass((r, target) => {
    const w = target.width, h = target.height, hw = Math.floor(w / 2), dpx = Math.max(0, Math.floor(h * dashF) - 4);
    r.setRenderTarget(target); r.setScissorTest(false); r.setClearColor(0x06080d, 1); r.clear();
    for (let i = 0; i < 2; i++) {
      const x = i ? w - hw : 0;
      target.viewport.set(x, 0, hw, h); target.scissor.set(x, dpx, hw, h - dpx); target.scissorTest = true;
      r.setRenderTarget(target);
      prepView(i, h);
      r.render(scene, cams[i]);
    }
    target.viewport.set(0, 0, w, h); target.scissor.set(0, 0, w, h); target.scissorTest = false; r.setRenderTarget(target);
    // ⚠️ giải MSAA trọn khung (blit bị scissor cắt ⇒ dải dưới tap-lô giữ rác ⇒ NaN loang đen) — xem mẫu 2
    const ac = r.autoClear; r.autoClear = false; r.render(EMPTY, cams[0]); r.autoClear = ac;
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.55, 0.92); composer.addPass(bloom);
  const blurPass = new ShaderPass(RadialBlurShader); composer.addPass(blurPass);
  composer.addPass(new OutputPass());

  // ---------- trạng thái ----------
  const G = { phase: "menu", t: 0, countT: 0, winner: -1, endT: 0, queue: [], auto: false, acc: [0.85, 0.6], nextAuto: [0, 0], nextFire: [0, 0], bumpT: 0, qList: [], slow: 0, cineW: -1,
    rqi: 0, round: null };                                  // 3q: lượt chơi (Same)
  const T0 = [null, null];
  const fresh = i => ({ i, s: 0, v: 0, a: 0, x: TEAMS[i].lanes[0], vx: 0, px: 0, yaw: 0, yk: 0, ykV: 0, E: 0, N: 0, steer: 0, boostK: 0, nitroK: 0, brake: 0, brakeT: 0, spinT: 0, spinDir: 1, shake: 0,
    y: 0, vy: 0, air: false, low: false, stallT: 0, lives: opt.lives | 0, airT: 0, ap: 0, ar: 0, ay: 0, flip: 0, flipDir: 1, flipGoal: null, bad: false, lbT: 0, jk: 0, blurB: 0, ramp: null, lapShown: 1,
    ms: 0, streak: 0, ok: 0, bad_: 0, hits: 0, lock: true, order: [], cur: null, smokeT: 0, aiLane: 0, aiFlipT: 0, aiDodgeT: -9, keyT: -99, touchT: -99, pad: { steer: 0, boost: 0, brake: 0 }, padT: -99,
    padSt: T0[i] ? T0[i].padSt : "", padOn: T0[i] ? T0[i].padOn : false, manual: null, fireT: -9, src: "ai", camK: 0, inc: null, done: false, brakeHeld: false, qn: 0, pick: -1, pickOk: false, inp: { steer: 0, boost: 0, brake: 0 }, qi: 0, qT: 0, smokeBlack: 0, pushT: 0, spinT0: 1.4, spinTurns: 1, hy: 0, hopV: 0, hitRoll: 0, forced: false, rollW: 7, rampPart: 0, wobA: 0, wobT: 9, markT: 0, burnT: 0, burnP: null, burnN: null, cx: 0, slipCd: 0, popK: 0, popT: 0.8 + Math.random() * 1.5 });
  const T = [fresh(0), fresh(1)];
  const later = (sec, fn) => G.queue.push({ at: G.t + sec, fn });

  function resetTeams() {
    T.forEach((t, i) => { T0[i] = t; T[i] = fresh(i); T0[i] = null; });
    missiles.clear(); trails.reset(); skids.clear(); cars.forEach(c => c.clearBurns && c.clearBurns()); G.winner = -1; G.queue = []; $(".sr-result").classList.remove("on"); $(".sr-banner").className = "sr-banner";
    halves.forEach(h => h.classList.remove("is-alarm", "is-locked", "is-win", "is-lose", "is-air", "is-nitro"));
  }

  // ---------- câu hỏi ----------
  let qSeq = 0;                                             // số câu toàn cục (không đặt lại khi chơi lại) ⇒ iPad bỏ được lệnh cũ
  function shareQ(t) {                                      // câu hỏi + đáp án + kết quả ⇒ iPad (chế độ 1 trả lời trên iPad)
    if (!remote || !remote.share) return;
    const c = G.phase === "race" ? t.cur : null;
    remote.share(t.i, "q", JSON.stringify({ n: t.qn, ph: G.phase, q: c ? c.q.question : "", a: c ? c.answers.map(a => a.text) : [], lock: !!t.lock, pick: t.pick, ok: t.pickOk ? 1 : 0,
      rev: c && t.pick >= 0 && !t.pickOk ? c.answers.map((a, j) => a.correct ? j : -1).filter(j => j >= 0) : [] }));
  }
  const lenCls = n => n > 90 ? "xl" : n > 58 ? "l" : n > 30 ? "m" : "s";
  function nextQ(t, e0) {
    let q, perm;
    if (e0) { q = questions[e0.k]; perm = e0.perm; }                  // 3q: lượt chung (Same) — cả 2 đội cùng câu cùng lúc
    else if (opt.sameQ) {                                        // 2 đội CÙNG bộ câu: cùng thứ tự câu + cùng thứ tự đáp án, mỗi đội đi theo nhịp của mình
      while (G.qList.length <= t.qi) shuffle(questions.map((_, k) => k)).forEach(k => G.qList.push({ k, perm: shuffle(questions[k].answers.map((_, j) => j)) }));
      const e = G.qList[t.qi++]; q = questions[e.k]; perm = e.perm;
    } else { if (!t.order.length) t.order = shuffle(questions.map((_, k) => k)); q = questions[t.order.shift()]; perm = shuffle(q.answers.map((_, j) => j)); }
    t.cur = { q, answers: perm.map(j => ({ text: q.answers[j].text, correct: !!q.answers[j].correct })) };
    t.qT = G.t;
    const h = H[t.i];
    h.q.textContent = q.question; h.q.dataset.len = lenCls(q.question.length);
    const ml = Math.max(...t.cur.answers.map(a => a.text.length));
    h.ans.dataset.n = t.cur.answers.length; h.ans.dataset.len = ml > 22 ? "l" : ml > 12 ? "m" : "s";
    h.ans.innerHTML = t.cur.answers.map((a, k) => `<button type="button" data-k="${k}"><span>${esc(a.text)}</span></button>`).join("");
    t.lock = false; h.el.classList.remove("is-qlock"); qboxes[t.i].classList.remove("fx-ok", "fx-bad");
    t.qn = ++qSeq; t.pick = -1; t.pickOk = false; shareQ(t);
  }
  H.forEach((h, i) => {
    h.ans.addEventListener("pointerdown", e => { const b = e.target.closest("button"); if (b && padMode !== 1) { e.preventDefault(); answer(i, +b.dataset.k); } });   // chế độ 1: trả lời trên iPad
    h.fire.addEventListener("pointerdown", e => { e.preventDefault(); fire(i); });
  });

  function answer(i, k) {
    const t = T[i];
    if (G.phase !== "race" || t.lock || t.done || !t.cur) return false;
    const ok = !!t.cur.answers[k]?.correct, btns = H[i].ans.querySelectorAll("button");
    t.lock = true; H[i].el.classList.add("is-qlock");
    btns[k]?.classList.add(ok ? "is-ok" : "is-bad");
    const fastK = clamp(1 - (G.t - t.qT - 1.5) / 6, 0, 1);
    if (btns[k]) ansFx(btns[k], ok ? (fastK > 0.7 ? "burst" : "glow") : "smoke");
    t.pick = k; t.pickOk = ok;
    const qb = qboxes[i]; qb.classList.remove("fx-ok", "fx-bad"); void qb.offsetWidth; qb.classList.add(ok ? "fx-ok" : "fx-bad");
    if (ok) {
      t.ok++; t.streak++;
      // ĐÚNG ⇒ KHÔNG tự tăng tốc: nạp thanh boost, trả lời càng nhanh nạp càng nhiều (≤ 1,5 s: 1,2 ô · ≥ 7,5 s: 0,6 ô)
      const fast = clamp(1 - (G.t - t.qT - 1.5) / 6, 0, 1), gain = 0.6 + 0.6 * fast;
      const full = t.E >= PHYS.CAP * SEG - 0.5; t.E = Math.min(PHYS.CAP * SEG, t.E + gain * SEG);
      if (t.streak >= opt.streak) { t.streak = 0; if (t.ms < opt.msMax) { t.ms++; toast(i, "+1 MISSILE", "ms"); } }
      else if (full) toast(i, "BOOST FULL", "info");
      else toast(i, fast > 0.7 ? "FAST! +BOOST" : "+BOOST", "ok");
      if (missiles.incoming(i) && t.src === "ai") { t.aiLane = 1 - t.aiLane; t.aiDodgeT = G.t; toast(i, "AUTO DODGE!", "ok"); }
      if (opt.sameQ) roundAnswered(i, true); else later(0.55, () => nextQ(t));   // 3q: Same = theo lượt
      onEvent("correct", { team: i, energy: t.E });
    } else {
      t.bad_++; t.streak = 0;
      // SAI ⇒ thanh boost xịt 0,6 ô + khói đen + chậm lại một chút
      const lost = Math.min(t.E, 0.6 * SEG), full = +(lost / SEG).toFixed(1);
      t.E -= lost; t.v *= 0.86; t.smokeBlack = 1.3; t.brakeT = 0.12;
      slip(t, 1);                                                                     // 3k: xe giật lắc + hơi mất lái
      t.cur.answers.forEach((a, j) => { if (a.correct) btns[j]?.classList.add("is-reveal"); });
      toast(i, lost > 0 ? "−BOOST" : "WRONG!", "bad");
      if (opt.sameQ) roundAnswered(i, false); else later(1.3, () => nextQ(t));
      onEvent("wrong", { team: i, lost });
      loseLife(i, "WRONG");                                                           // 3q: Lives — sai −1
    }
    shareQ(t);
    return ok;
  }
  // ---------- 3q: LƯỢT (Same) — đội đúng trước ⇒ đội kia còn TIME DELAY · đội sai trước ⇒ đội kia còn MISS WAIT · xong / hết giờ ⇒ câu mới ----------
  function startRound() {
    if (G.phase !== "race") return;
    while (G.qList.length <= G.rqi) shuffle(questions.map((_, k) => k)).forEach(k => G.qList.push({ k, perm: shuffle(questions[k].answers.map((_, j) => j)) }));
    const e = G.qList[G.rqi++];
    G.round = { res: T.map(t => (t.done ? "out" : null)), dl: null, win: 0, wait: -1, ending: false };
    T.forEach(t => { if (!t.done) nextQ(t, e); });
    waitBar(-1);
  }
  function roundAnswered(i, ok) {
    const R = G.round; if (!R || R.ending) return;
    R.res[i] = ok ? "ok" : "bad";
    const o = 1 - i;
    if (R.res[o]) { endRound(ok ? 0.55 : 1.3); return; }
    const w = ok ? opt.tieWait : opt.missWait;
    if (w === Infinity) { toast(o, ok ? "YOUR TURN!" : "YOUR CHANCE!", "info"); return; }
    if (w <= 0.1 && ok) { lockOut(o, "TOO LATE!"); endRound(0.55); return; }            // Time delay nấc thấp nhất = khoá ngay (như Fight AWord)
    R.dl = G.t + Math.max(0.1, w); R.win = Math.max(0.1, w); R.wait = o; waitBar(o);
    toast(o, ok ? "HURRY!" : "YOUR CHANCE!", "info");
  }
  function lockOut(o, text) {
    const t = T[o], R = G.round; if (!R || R.res[o] || t.done) return;
    R.res[o] = "late"; t.lock = true; H[o].el.classList.add("is-qlock");
    if (t.cur) { const btns = H[o].ans.querySelectorAll("button"); t.cur.answers.forEach((a, j) => { if (a.correct) btns[j]?.classList.add("is-reveal"); }); }
    toast(o, text, "bad"); shareQ(t);
  }
  function endRound(delay) {
    const R = G.round; if (!R || R.ending) return;
    R.ending = true; R.dl = null; waitBar(-1);
    later(delay, startRound);
  }
  function roundTick() {                                     // mỗi khung (frame): hết Time delay / Miss wait ⇒ khoá đội chậm, sang câu mới
    const R = G.round; if (!R || R.ending || G.phase !== "race") return;
    if (R.dl != null && G.t >= R.dl) { lockOut(R.wait, "TIME!"); endRound(0.9); return; }
    if (R.res.every(Boolean)) endRound(0.55);
  }
  function waitBar(i) {                                      // thanh đếm ngược dưới ô câu hỏi của đội đang được chờ
    qboxes.forEach((q, k) => { const b = q.querySelector(".rw-wait"); if (b) b.classList.toggle("on", k === i); });
  }
  // ---------- 3q: LIVES (vạch năng lượng ở cột kính mép ngoài) ----------
  function paintLives() {
    halves.forEach((h, i) => {
      let el = h.querySelector(".rw-lives");
      if (!opt.lives) { if (el) el.remove(); return; }
      if (!el || el.children.length !== opt.lives) { if (el) el.remove(); el = document.createElement("div"); el.className = "rw-lives"; el.innerHTML = "<i></i>".repeat(opt.lives); h.appendChild(el); }
      [...el.children].forEach((c, k) => c.classList.toggle("off", k >= T[i].lives));
      el.classList.toggle("is-low", T[i].lives <= 1);
    });
  }
  function loseLife(i, why) {
    const t = T[i]; if (!opt.lives || t.done || G.phase !== "race" || t.lives <= 0) return;
    t.lives--; paintLives();
    const el = halves[i].querySelector(".rw-lives"); if (el) { el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit"); }
    onEvent("life", { team: i, lives: t.lives, why });
    if (t.lives <= 0) knockOut(i);
  }
  function knockOut(i) {                                     // hết mạng ⇒ xe NỔ, đội kia thắng
    const t = T[i];
    missiles.boom(t.x, -t.s, "hit");
    const bn = cars[i].burn ? cars[i].burn(0.4) : null; if (bn) { t.burnT = 4; t.burnP = bn.p; t.burnN = bn.n; }
    t.spinT0 = t.spinT = 1.4; t.spinTurns = Math.random() < 0.5 ? -1.3 : 1.3; t.hopV = 4; t.shake = 1; t.blurB = 1; t.smokeBlack = 6; t.v *= 0.2;
    toast(i, "OUT OF LIVES!", "bad"); toast(1 - i, "KNOCKOUT!", "ok");
    onEvent("knockout", { team: i });
    if (G.winner < 0) finish(1 - i);
  }
  // 3k: hiệu ứng trên NÚT trả lời — burst (đúng + nhanh): chớp sáng + 2 vòng sóng + 16 tia lửa · glow (đúng) · smoke (sai): 9 cụm khói xịt ra quanh nút
  function ansFx(btn, kind) {
    const fx = document.createElement("i"); fx.className = "sr-afx k-" + kind; btn.appendChild(fx);
    if (kind === "burst") for (let n = 0; n < 16; n++) { const p = document.createElement("b"); p.style.setProperty("--a", (n / 16 * 360 + Math.random() * 14) + "deg"); p.style.setProperty("--d", (5 + Math.random() * 6).toFixed(1) + "cqh"); fx.appendChild(p); }
    if (kind === "smoke") for (let n = 0; n < 9; n++) { const p = document.createElement("b"); const a = Math.random() * Math.PI * 2;
      p.style.setProperty("--x", (50 + Math.cos(a) * 46).toFixed(0) + "%"); p.style.setProperty("--y", (50 + Math.sin(a) * 40).toFixed(0) + "%");
      p.style.setProperty("--dx", (Math.cos(a) * (2 + Math.random() * 3)).toFixed(1) + "cqh"); p.style.setProperty("--dy", (Math.sin(a) * 2 - 2.5 - Math.random() * 2).toFixed(1) + "cqh");
      p.style.setProperty("--dl", (Math.random() * 0.25).toFixed(2) + "s"); fx.appendChild(p); }
    setTimeout(() => fx.remove(), 1600);
  }
  // 3k: xe giật lắc + mất lái nhẹ (trả lời sai / xe trước phanh gấp): văng ngang, lò xo xoay thân, lắc nghiêng, rung máy quay
  function slip(t, k = 1) {
    if (t.air || t.done) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    t.px += dir * 1.7 * k; t.ykV += dir * 2.4 * k; t.wobA = 0.05 * k * -dir; t.wobT = 0; t.shake = Math.max(t.shake, 0.45 * k);
  }
  const toastAt = [-9, -9];
  function toast(i, text, kind) { const el = H[i].toast; el.textContent = text; el.className = "sr-toast"; void el.offsetWidth; el.className = "sr-toast on k-" + kind; toastAt[i] = G.t; }

  // ---------- tên lửa ----------
  function predict(j, tl) {
    const t = T[j], a = clamp(t.a, -PHYS.HARD, PHYS.ACCB);
    let ds = t.v * tl + 0.5 * a * tl * tl;
    if (a < 0 && t.v + a * tl < 0) ds = t.v * t.v / (-2 * a);
    ds = Math.max(ds, 0);
    return { s: t.s + ds, x: clamp(t.x + (t.vx + t.px) * Math.min(tl, 0.5), -ROADX, ROADX) };
  }
  const VF = new THREE.Vector3();
  // nút tên lửa: CHÍNH quả ở ô cao nhất bay lên; còn kho ⇒ 1 icon chờ thụt xuống + quả mới trồi từ dưới lên ô đó (HUD không đụng ô đang diễn)
  function fireAnim(i, nBefore) {
    const h = H[i], j = Math.max(0, Math.min(nBefore, 2) - 1), slot = h.slots[j], reload = nBefore >= 3, now = performance.now();
    h.slotBusy[j] = now + 1100;
    slot.classList.remove("load"); void slot.offsetWidth; slot.classList.add("fly");
    if (reload) { h.msHold = now + 700; const ic = h.ms.querySelectorAll("svg"); ic[ic.length - 1]?.classList.add("sink"); }
    setTimeout(() => { slot.classList.remove("fly"); if (reload) { void slot.offsetWidth; slot.classList.add("on", "load"); } else slot.classList.remove("on"); }, 520);
    setTimeout(() => { h.msN = -1; }, 700);
  }
  function paintSlots(t, h) {                                // trạng thái tĩnh: ô j có quả khi j < min(ms, 2); vừa có thêm ⇒ trồi lên (nạp)
    const now = performance.now(), ready = Math.min(t.ms, 2);
    h.slots.forEach((sl, j) => {
      if (now < h.slotBusy[j]) return;
      const on = j < ready, was = sl.classList.contains("on");
      if (on && !was) { sl.classList.remove("load"); void sl.offsetWidth; sl.classList.add("on", "load"); }
      else if (!on && was) sl.classList.remove("on", "load");
    });
  }
  function fire(i) {
    const t = T[i], j = 1 - i;
    if (G.phase !== "race" || t.ms <= 0 || t.done || T[j].done || G.t - t.fireT < 1.0 || t.spinT > 0) return false;
    const slot = Math.max(0, Math.min(t.ms, 2) - 1), Lc = cars[i].launcher, wp = Lc.slotWorld(slot, VF);
    Lc.sc[slot] = 0;                                         // quả này rời giá ⇒ chỗ trống, quả mới nạp lên dần (nếu còn)
    t.ms--; t.fireT = G.t;
    missiles.launch({ from: i, to: j, x: wp.x, y: wp.y, z: wp.z, predict: tl => predict(j, tl), color: TEAMS[i].color });
    fireAnim(i, t.ms + 1);
    toast(i, "MISSILE AWAY!", "ms");
    onEvent("fire", { team: i });
    return true;
  }
  function impact(h) {
    const tg = T[h.to], ds = tg.s - h.P.s, dx = tg.x - h.P.x;
    let kind = Math.abs(dx) < 1.55 && Math.abs(ds) < 3.4 ? "hit" : Math.hypot(dx, ds * 0.6) < 4.2 ? "graze" : "miss";
    if (tg.done || G.phase !== "race") kind = "miss";
    const jumped = kind !== "miss" && tg.y > 1.6;                // đang bay cao trên cầu nhảy ⇒ tên lửa nổ dưới gầm
    if (jumped) kind = "miss";
    if (kind === "hit") {
      missiles.boom(tg.x, -tg.s - 3, "hit");                  // 3d: nổ ngay TRƯỚC mũi xe (không loá trắng cả buồng lái), rồi khói đen trùm
      const lost = Math.min(tg.E, opt.hitLoss * SEG); tg.E -= lost;
      // mỗi lần trúng một kiểu: thời gian xoay, số vòng (cả lẻ — phần dư trả về dần qua lò xo văng đuôi), văng ngang, nảy lên, nghiêng
      const sg = Math.random() < 0.5 ? -1 : 1;
      // 3q: MISSILE DAMAGES L (1–5): xoay + đứng yên ≈ L giây (mức 2 ≈ như bản cũ), khói đen che kính 0,8 + 0,75·L giây
      const L = clamp(opt.msDmg | 0 || 2, 1, 5), spin = Math.min(L, 0.6 + 0.4 * L) * (0.9 + Math.random() * 0.2);
      tg.spinT0 = tg.spinT = spin; tg.stallT = Math.max(0, L - spin); tg.spinTurns = sg * (0.55 + Math.random() * (0.6 + 0.35 * L));
      tg.v *= 0.3 + Math.random() * 0.3; tg.px += (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 5.5);
      tg.hopV = 1.2 + Math.random() * 3.6; tg.hitRoll = (Math.random() - 0.5) * 1.3;
      tg.shake = 1; tg.blurB = 0.8; T[h.from].hits++;
      const bn = cars[h.to].burn ? cars[h.to].burn(2.2) : null; if (bn) { tg.burnT = 2.6; tg.burnP = bn.p; tg.burnN = bn.n; }   // 3j: cháy rồi để vết đen
      const sm = H[h.to].smoke, smD = (0.8 + 0.75 * clamp(opt.msDmg | 0 || 2, 1, 5)).toFixed(2) + "s";   // 3q: khói theo mức thiệt hại
      sm.style.animationDuration = smD; sm.querySelectorAll("i").forEach(x => { x.style.animationDuration = smD; });
      sm.classList.remove("on"); void sm.offsetWidth; sm.classList.add("on");
      for (let k = 0; k < 70; k++) { const a = Math.random() * TAU, r = Math.random() * 2.5;
        missiles.dark.emit(tg.x + Math.cos(a) * r, 0.6 + Math.random() * 1.8, -tg.s - 2 - Math.random() * 7, Math.cos(a) * 1.5, 0.6 + Math.random() * 1.8, -tg.v * 0.35 + (Math.random() - 0.5) * 2, 2 + Math.random() * 1.6, 2.6 + Math.random() * 1.8, 0.9, 2.4, 0.8); }
      toast(h.to, lost > 0 ? `HIT! −${Math.round(lost / SEG)} ⚡` : "HIT!", "bad"); toast(h.from, "DIRECT HIT!", "ok");
      loseLife(h.to, "HIT");                                                          // 3q: Lives — trúng −1
    } else if (kind === "graze") {
      missiles.boom(h.P.x, -h.P.s, "graze");
      tg.v *= 0.6; tg.brakeT = 0.35; tg.shake = 0.6;
      toast(h.to, "GRAZED!", "bad"); toast(h.from, "CLOSE!", "info");
    } else {
      missiles.boom(h.P.x, -h.P.s, "miss");
      if (G.phase === "race") { toast(h.to, jumped ? "JUMPED IT!" : "DODGED!", "ok"); toast(h.from, "MISSED", "info"); }
    }
    onEvent("impact", { from: h.from, to: h.to, kind, dx: +dx.toFixed(2), ds: +ds.toFixed(2) });
  }

  function popExhaust(i) {
    const t = T[i], c = cars[i]; t.popK = 1;
    c.body.updateMatrixWorld(true);
    (c.exhaust || []).forEach(p => {
      const w = c.body.localToWorld(SK.copy(p));
      for (let n = 0; n < 3; n++) missiles.smoke.emit(w.x + (Math.random() - 0.5) * 0.1, w.y, w.z + 0.1, (Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 0.5, 1 + Math.random() * 1.2, 0.8 + Math.random() * 0.6, 0.32, 0.4, 2.2, 1.2);
      for (let n = 0; n < 3; n++) missiles.sparks.emit(w.x, w.y, w.z + 0.05, (Math.random() - 0.5) * 1.4, Math.random() * 1.2, 2 + Math.random() * 2.5, 0.25 + Math.random() * 0.2, 0.06, 1, 0, 1.4);
    });
  }
  // ---------- 3j: vết lốp trên đường — 1 InstancedMesh, vòng đệm 900 đoạn (đoạn cũ nhất bị thay) ----------
  const SK = new THREE.Vector3(), skPrev = new Array(8).fill(null);
  const skids = (() => {
    const N = 900, g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const m = bend(new THREE.MeshBasicMaterial({ color: 0x0d0d0f, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    const im = new THREE.InstancedMesh(g, m, N); im.frustumCulled = false; im.count = 0; im.renderOrder = -1; scene.add(im);
    const O = new THREE.Object3D(); let k = 0, n = 0;
    return {
      seg(a, b, w) {
        O.position.set((a.x + b.x) / 2, 0.018, (a.z + b.z) / 2); O.rotation.set(0, Math.atan2(b.x - a.x, b.z - a.z), 0);
        O.scale.set(0.24 * w / 0.5, 1, Math.hypot(b.x - a.x, b.z - a.z));   // dài ĐÚNG khoảng cách: chồng mép ⇒ chỗ chồng đậm gấp đôi thành sọc bậc thang O.updateMatrix();
        im.setMatrixAt(k, O.matrix); k = (k + 1) % N; n = Math.min(N, n + 1); im.count = n; im.instanceMatrix.needsUpdate = true;
      },
      clear() { k = 0; n = 0; im.count = 0; },
      dispose() { scene.remove(im); g.dispose(); m.dispose(); }
    };
  })();

  // ---------- nhịp trận ----------
  function start() {
    if (G.phase === "count" || G.phase === "race") return false;
    resetTeams(); G.phase = "count"; G.countT = 0; G.qList = []; G.round = null; paintLives(); waitBar(-1);
    mount.classList.add("is-count"); mount.classList.remove("is-menu", "is-end");
    const lights = $$(".sr-lights i"); lights.forEach(l => l.classList.remove("on"));
    for (let k = 0; k < 5; k++) later(0.6 + k * 0.55, () => lights[k].classList.add("on"));
    later(0.6 + 4 * 0.55 + 0.75 + Math.random() * 0.3, go);
    H.forEach(h => { h.q.textContent = ""; h.ans.innerHTML = ""; });
    closePanel(); tools.close(); T.forEach(shareQ);
    return true;
  }
  function go() {
    G.phase = "race"; mount.classList.remove("is-count"); mount.classList.add("is-race");
    $$(".sr-lights i").forEach(l => l.classList.remove("on"));
    const g = $(".sr-go"); g.classList.remove("pop"); void g.offsetWidth; g.classList.add("pop");
    G.rqi = 0; G.round = null;
    if (opt.sameQ) startRound(); else T.forEach(t => nextQ(t));                    // 3q: Same = theo lượt
    G.nextAuto = [G.t + 1 + Math.random() * 2, G.t + 1 + Math.random() * 2];
  }
  function finish(w) {
    if (G.round) { G.round.ending = true; G.round.dl = null; } waitBar(-1);   // 3q
    G.winner = w; G.endT = G.t; G.phase = "end"; mount.classList.remove("is-race"); mount.classList.add("is-end");
    T.forEach(t => { t.lock = true; t.done = true; }); halves.forEach(h => h.classList.add("is-qlock"));
    halves[w].classList.add("is-win"); halves[1 - w].classList.add("is-lose");
    // SLOW MOTION + máy quay điện ảnh trong SLOW_T giây thật, rồi mới hiện chữ thắng
    G.slow = SLOW_T; G.cineW = w; mount.classList.add("is-cine");
    const b = $(".sr-banner");
    later(0.62, () => { b.textContent = TEAMS[w].name + " WINS!"; b.style.setProperty("--team", TEAMS[w].color); b.className = "sr-banner on"; });
    later(0.62 + 3.2 + 0.4, () => prepBurnsSoft());           // 3p: bảng kết quả đứng yên ⇒ làm lại chỗ cháy cho ván sau
    later(0.62 + 3.2, () => {
      $(".sr-res-title").innerHTML = `<span style="color:${TEAMS[w].color}">${TEAMS[w].name}</span> WINS`;
      $(".sr-res-rows").innerHTML = T.map(t => `<div style="--team:${TEAMS[t.i].color}"><b>${TEAMS[t.i].name}</b><span>${Math.round(Math.min(t.s, FIN))} / ${FIN} m</span><span>✔ ${t.ok} · ✘ ${t.bad_}</span><span>🚀 ${t.hits} hit${t.hits === 1 ? "" : "s"}</span></div>`).join("");
      $(".sr-result").classList.add("on");
    });
    T.forEach(shareQ);
    onEvent("end", { winner: w });
  }
  function toMenu() {                                       // Menu ▸ về màn chờ (bỏ trận đang chơi)
    resetTeams(); G.phase = "menu"; G.slow = 0; G.cineW = -1; mount.classList.remove("is-cine");
    mount.classList.remove("is-count", "is-race", "is-end"); mount.classList.add("is-menu");
    H.forEach(h => { h.q.textContent = ""; h.ans.innerHTML = ""; h.el.classList.remove("is-qlock"); });
    T.forEach(shareQ);
    onEvent("menu", {});                                     // 3n: trang hiện lại xưởng intro
  }
  $(".sr-start").addEventListener("click", () => start());
  $(".sr-again").addEventListener("click", () => start());
  mount.classList.add("is-menu");

  // ---------- iPad (bảng) ----------
  const panel = $(".sr-panel");
  const PADM_KEY = "speedrun.padMode";
  let padMode = opt.padMode != null ? opt.padMode : host ? 0 : (() => { try { const v = +localStorage.getItem(PADM_KEY); return v === 1 || v === 2 ? v : 0; } catch (e) { return 0; } })();
  const PM = [
    { t: "iPad OFF", d: "Race, questions and answers on the big screen." },
    { t: "Answer on iPad", d: "Questions only on the iPad; race on the big screen." },
    { t: "Drive on iPad", d: "The iPad is the wheel + pedals + missile button." },
  ];
  const pBody = $(".sr-panel-body"), pHead = $(".sr-panel-h");
  function openPanel() {                                    // bảng iPad NHỎ giữa màn: chọn ⇒ hỏi xác nhận ⇒ OK là đóng (trận vẫn chạy tiếp)
    panel.hidden = false; panel.classList.add("is-small"); pHead.textContent = "iPad";
    pBody.innerHTML = `<div class="sr-pm">${PM.map((m, k) => `<button type="button" class="sr-pm-o${k === padMode ? " on" : ""}" data-m="${k}"><b>${k + 1}. ${m.t}</b><span>${m.d}</span></button>`).join("")}</div>
      <div class="sr-pm-st">${[0, 1].map(i => `<span data-t="${i}" data-s="${T[i].padOn ? "on" : ""}" style="--team:${TEAMS[i].color}"><i></i>${TEAMS[i].name} iPad</span>`).join("")}</div>
      <div class="sr-cf" hidden><p></p><div><button type="button" class="sr-cf-no">Cancel</button><button type="button" class="sr-cf-ok">OK</button></div></div>`;
    const cf = pBody.querySelector(".sr-cf"); let pend = -1;
    pBody.querySelectorAll(".sr-pm-o").forEach(b => b.addEventListener("click", () => { pend = +b.dataset.m; cf.querySelector("p").innerHTML = `Switch to <b>${pend + 1}. ${PM[pend].t}</b>?`; cf.hidden = false; }));
    cf.querySelector(".sr-cf-no").addEventListener("click", () => { cf.hidden = true; });
    cf.querySelector(".sr-cf-ok").addEventListener("click", () => { if (pend >= 0) setPadMode(pend); closePanel(); });
  }
  // 3o: AWord — bảng Options THẬT của AWord gắn trên game (lớp chung chứa cả khung game + hàng nút), neo trên hàng nút; game dừng tới khi đóng
  function openHostOptions() {
    closePanel();
    const layer = mount.parentElement || mount, wasPaused = G.paused;
    G.paused = true; onEvent("pause", true);
    host.options({ layer, top: () => bar ? bar.getBoundingClientRect().top - layer.getBoundingClientRect().top : layer.clientHeight,
      onClose: () => { if (!wasPaused && !pmenu.on) { G.paused = false; last = 0; onEvent("pause", false); } } });
  }
  // 3o: AWord — nút Thư mục = act THẬT cùng thư mục (host.listActs), bấm là mở
  function openFolder() {
    panel.hidden = false; panel.classList.add("is-small"); pHead.textContent = "Switch activity";
    pBody.innerHTML = `<p class="sr-fd-note">Loading…</p>`;
    Promise.resolve().then(() => host.listActs()).then(d => {
      if (panel.hidden) return;
      const groups = (d && d.groups) || [];
      if (d && d.folderName) pHead.textContent = d.folderName;
      pBody.innerHTML = groups.length ? `<div class="sr-fd">${groups.map(g => (g.path ? `<p class="sr-fd-grp">${esc(g.path)}</p>` : "") + g.acts.map(a =>
        `<button type="button" class="sr-fd-row${a.current ? " is-on" : ""}" data-id="${esc(String(a.id))}"${a.current ? " disabled" : ""}>${esc(a.title || "Untitled")}</button>`).join("")).join("")}</div>`
        : `<p class="sr-fd-note">No other activities in this folder.</p>`;
      pBody.querySelectorAll(".sr-fd-row[data-id]").forEach(b => b.addEventListener("click", () => { closePanel(); host.openAct(b.dataset.id); }));
    }).catch(() => { pBody.innerHTML = `<p class="sr-fd-note">Could not load the folder.</p>`; });
  }
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function openOptions() {                                  // Options riêng (chỉ khi chạy ở myGame, không có host): cùng / khác câu hỏi · số tên lửa tối đa
    if (host && host.options) { openHostOptions(); return; }
    panel.hidden = false; panel.classList.add("is-small"); pHead.textContent = "Options";
    const paint = () => {
      pBody.innerHTML = `<div class="sr-opt">
        <div class="sr-opt-row"><span>Questions</span><div class="sr-seg"><button type="button" data-q="1" class="${opt.sameQ ? "on" : ""}">Same for both teams</button><button type="button" data-q="0" class="${opt.sameQ ? "" : "on"}">Different</button></div></div>
        <div class="sr-opt-row"><span>Missiles (max)</span><div class="sr-step"><button type="button" data-d="-1">−</button><b>${opt.msMax}</b><button type="button" data-d="1">+</button></div></div></div>`;
      pBody.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => { opt.sameQ = b.dataset.q === "1"; save(); paint(); }));
      pBody.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { opt.msMax = clamp(opt.msMax + +b.dataset.d, 1, 10); T.forEach(t => { t.ms = Math.min(t.ms, opt.msMax); }); save(); paint(); }));
    };
    const save = () => { try { localStorage.setItem(OPT_KEY, JSON.stringify({ sameQ: opt.sameQ, msMax: opt.msMax })); } catch (e) { /* */ } };
    paint();
  }
  function closePanel() { if (panel.hidden) return; panel.hidden = true; panel.classList.remove("is-small"); try { remote && remote.panelClosed && remote.panelClosed(); } catch (e) { /* */ } }
  function setPadMode(m) {
    padMode = m; if (!host) try { localStorage.setItem(PADM_KEY, String(m)); } catch (e) { /* */ }
    mount.classList.toggle("pm1", m === 1); mount.classList.toggle("pm2", m === 2);
    touch.forEach(x => x.clear()); paintTouch();
    if (remote && remote.share) [0, 1].forEach(i => remote.share(i, "m", String(m)));
    T.forEach(shareQ);
    onEvent("padMode", m);
  }
  $(".sr-panel-x").addEventListener("click", closePanel);
  panel.addEventListener("pointerdown", e => { if (e.target === panel) closePanel(); });

  // ---------- 3j: bảng MENU (như Rocket Race): giữa màn, game TẠM DỪNG; RESUME / bấm ☰ lại / bấm nền mờ / Esc ⇒ đóng ----------
  const pmenu = (() => {
    const el = $(".sr-pmenu"), note = $(".sr-pmenu-note");
    const open = () => { el.hidden = false; G.paused = true; note.textContent = ""; mount.classList.add("is-paused"); };
    const close = () => { el.hidden = true; G.paused = false; last = 0; mount.classList.remove("is-paused"); };
    el.addEventListener("pointerdown", e => { if (e.target === el) close(); });
    el.querySelector(".sr-pmenu-box").addEventListener("click", e => {
      const b = e.target.closest("button[data-m]"); if (!b) return;
      const m = b.dataset.m;
      if (m === "resume") close();
      else if (m === "again") { close(); toMenu(); }                                 // 3k: về màn chờ START (không vào đua ngay)
      else if (m === "cars") { close(); toMenu(); }
      else if (m === "tpl") {                                                        // 3o: AWord — danh sách template + Library
        const list = (host && host.templates ? host.templates() : []) || [];
        if (!host) { note.textContent = "Change template — available when RACING WORDS runs inside AWord."; return; }
        note.innerHTML = `<div class="sr-pm-tpl">${host.home ? `<button type="button" data-lib="1">LIBRARY</button>` : ""}${list.map(t => `<button type="button" data-t="${esc(t.type)}">${esc(t.label)}</button>`).join("")}</div>`;
      }
    });
    note.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b || !host) return;
      e.stopPropagation();
      if (b.dataset.lib) host.home(); else if (b.dataset.t) host.switchTemplate(b.dataset.t);
    });
    return { open, close, toggle: () => el.hidden ? open() : close(), get on() { return !el.hidden; } };
  })();
  const onEsc = e => { if (e.code === "Escape" && !dead && !e.defaultPrevented && !document.querySelector(".aw-ovl, .aw-opt-panel")) pmenu.toggle(); };   // 3o: gỡ khi destroy; bảng AWord đang mở thì nhường
  window.addEventListener("keydown", onEsc);

  // ---------- hàng nút chức năng: 1 nút góc phải, bấm ⇒ bung các nút sang trái, bấm chỗ khác ⇒ thu lại ----------
  const tools = (() => {
    if (!bar) return { close() {}, dispose() {} };
    bar.classList.add("sr-bar");
    bar.innerHTML = `<div class="sr-tools">
        <button class="sr-tool" data-k="menu" title="Menu">${TOOL_ICON.menu}</button>
        <button class="sr-tool" data-k="sound" title="Sound">${TOOL_ICON.sound}</button>
        <button class="sr-tool" data-k="folder" title="Switch activity">${TOOL_ICON.folder}</button>
        <button class="sr-tool" data-k="options" title="Options">${TOOL_ICON.options}</button>
        ${remote ? `<button class="sr-tool" data-k="ipad" title="iPad">${TOOL_ICON.ipad}</button>` : ""}
      </div><button class="sr-toolmain" type="button" title="Controls" aria-label="Controls">${TOOL_ICON.more}</button><div class="sr-tooltip"></div>`;
    const main = bar.querySelector(".sr-toolmain"), tip = bar.querySelector(".sr-tooltip");
    let tipT = 0;
    const say = txt => { tip.textContent = txt; tip.classList.add("on"); clearTimeout(tipT); tipT = setTimeout(() => tip.classList.remove("on"), 1800); };
    const open = () => bar.classList.add("is-open"), close = () => bar.classList.remove("is-open");
    main.addEventListener("click", () => bar.classList.contains("is-open") ? close() : open());
    bar.querySelector(".sr-tools").addEventListener("click", e => {
      const b = e.target.closest(".sr-tool"); if (!b) return;
      const k = b.dataset.k;
      if (k === "menu") pmenu.toggle();
      else if (k === "sound") { b.classList.toggle("is-off"); say(b.classList.contains("is-off") ? "Sound off" : "Sound on"); }
      else if (k === "folder") { if (host && host.listActs) (panel.hidden ? openFolder() : closePanel()); else say("Switch activity — available inside AWord"); }
      else if (k === "options") openOptions();
      else if (k === "ipad") { panel.hidden ? openPanel() : closePanel(); }
    });
    // 3j: thầy: hàng nút KHÔNG tự đóng khi bấm chỗ khác / bấm nút con — chỉ đóng khi bấm lại nút Controls
    return { close() { /* 3j: không tự đóng */ }, closeNow: close, dispose() { bar.innerHTML = ""; bar.classList.remove("sr-bar", "is-open"); } };
  })();

  // ---------- điều khiển: bàn phím · nút trên màn (BOOST/PHANH, nửa vô lăng) · iPad ----------
  const held = [new Set(), new Set()], touch = [new Map(), new Map()];   // touch: pointerId → "l"|"r"|"b"|"k"
  const KEYMAP = { KeyA: [0, "l"], KeyD: [0, "r"], KeyW: [0, "b"], KeyS: [0, "k"], KeyF: [0, "f"], ArrowLeft: [1, "l"], ArrowRight: [1, "r"], ArrowUp: [1, "b"], ArrowDown: [1, "k"], Enter: [1, "f"], ShiftRight: [1, "f"] };
  const onKeyDown = e => {
    const m = KEYMAP[e.code]; if (!m || e.target.closest?.("input,textarea")) return;
    if (e.code.startsWith("Arrow")) e.preventDefault();
    if (G.paused) return;
    const [i, k] = m; T[i].keyT = G.t;
    if (G.phase === "menu" && (k === "l" || k === "r")) { if (!e.repeat) stepCar(i, k === "l" ? -1 : 1); return; }   // 3i: chọn xe
    if (k === "f") { if (!e.repeat) fire(i); return; }
    held[i].add(k);
  };
  const onKeyUp = e => { const m = KEYMAP[e.code]; if (m) held[m[0]].delete(m[1]); };
  const onBlur = () => { held.forEach(h => h.clear()); touch.forEach(t => t.clear()); paintTouch(); };
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("blur", onBlur);
  function paintTouch() {
    H.forEach((h, i) => { const v = [...touch[i].values()];
      const t = T[i], man = t.src === "pad" || t.src === "touch" || t.src === "key", p = t.inp;   // nhấn tay HOẶC iPad/phím đang giữ ⇒ vô lăng sáng + bàn đạp lún
      h.wbox.classList.toggle("is-l", v.includes("l") || (man && p.steer < -0.3)); h.wbox.classList.toggle("is-r", v.includes("r") || (man && p.steer > 0.3));
      h.boost.classList.toggle("is-down", v.includes("b") || (man && !!p.boost)); h.brake.classList.toggle("is-down", v.includes("k") || (man && !!p.brake)); });
  }
  function bindHold(el, i, kindOf) {                       // giữ để lái/đạp — nhiều ngón cùng lúc được (mỗi pointerId 1 việc)
    const down = e => { e.preventDefault(); if (padMode === 2) return; const k0 = kindOf(e); if (!k0) return; try { el.setPointerCapture(e.pointerId); } catch (x) { /* */ } touch[i].set(e.pointerId, k0); T[i].touchT = G.t; paintTouch(); };
    const move = e => { if (!touch[i].has(e.pointerId)) return; const k = kindOf(e); if (k && k !== touch[i].get(e.pointerId)) { touch[i].set(e.pointerId, k); paintTouch(); } T[i].touchT = G.t; };
    const up = e => { if (touch[i].delete(e.pointerId)) paintTouch(); };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => el.addEventListener(n, up));
  }
  H.forEach((h, i) => {
    bindHold(h.wbox, i, e => {                             // nửa trái/phải VÔ LĂNG — chỉ trong vòng tròn vô lăng (+12 %)
      const w = h.wheel, r = w.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const sc = h.wbox.getBoundingClientRect().width / Math.max(1, h.wbox.offsetWidth), rad = w.offsetWidth / 2 * sc * 1.12;   // sc: nếu khung bị thu phóng
      return dx * dx + dy * dy <= rad * rad ? (dx < 0 ? "l" : "r") : null;
    });
    bindHold(h.boost, i, () => "b"); bindHold(h.brake, i, () => "k");
  });

  const ZERO = { steer: 0, boost: 0, brake: 0 };
  function idleInput(t) {                                   // ngoài lúc đua: chỉ để vô lăng / bàn đạp trên màn lớn đi theo tay người (iPad, phím, chạm)
    if (t.padOn && padMode === 2) { t.src = "pad"; return G.t - t.padT < 0.45 ? t.pad : ZERO; }
    const tv = [...touch[t.i].values()], hk = held[t.i];
    if (tv.length || hk.size) { t.src = tv.length ? "touch" : "key"; const has = k => hk.has(k) || tv.includes(k); return { steer: (has("r") ? 1 : 0) - (has("l") ? 1 : 0), boost: +has("b"), brake: +has("k") }; }
    return ZERO;
  }
  function input(t) {
    if (t.padOn && padMode === 2) { t.src = "pad"; return G.t - t.padT < 0.45 ? t.pad : { steer: 0, boost: 0, brake: 0 }; }
    const tv = [...touch[t.i].values()], hk = held[t.i];
    if (tv.length || G.t - t.touchT < 4 || G.t - t.keyT < 4) {
      t.src = t.touchT > t.keyT ? "touch" : "key";
      const has = k => hk.has(k) || tv.includes(k);
      return { steer: (has("r") ? 1 : 0) - (has("l") ? 1 : 0), boost: +has("b"), brake: +has("k") };
    }
    if (t.manual) { t.src = "test"; return t.manual; }
    t.src = "ai";
    return aiInput(t);
  }
  // tự lái: giữ làn · nhắm dốc phía trước · vượt khi xe kia chắn đầu · né tên lửa · dùng Nitro khi nhiều · thỉnh thoảng xoay 360 trên không
  function aiInput(t) {
    const o = T[1 - t.i];
    let tx = TEAMS[t.i].lanes[t.aiLane];
    const dodging = t.inc && G.t - t.aiDodgeT < 2.5;
    const ra = ramps.ahead(t.s, 110);
    if (ra && !dodging && !t.air) tx = clamp(ra.r.x, -ROADX + 1.2, ROADX - 1.2);
    if (t.air) return { steer: 0, boost: 0, brake: G.t < t.aiFlipT ? 1 : 0 };
    // 3k: tự lái bám làn NHẸ (lực văng khúc cua làm xe trôi ra ngoài một chút) · BOOST chỉ khi bàn thử bật "Tự chơi" (G.auto) — câu đúng KHÔNG tự tăng tốc
    return { steer: clamp((tx - t.x) * 0.25 - (t.vx + t.px + t.cx) * 0.12, -1, 1), boost: G.auto && (t.E > SEG * 1.4 || (ra && ra.d < 50 && t.E > SEG * 0.3)) ? 1 : 0, brake: 0 };
  }

  // ---------- vật lý xe ----------
  // xe chạm dốc: cov = phần bề ngang xe nằm trên dốc (0..1), side = dốc ở bên PHẢI (+1) hay TRÁI (−1) của xe
  function rampContact(t) {
    const hw = cars[t.i].M.W / 2;
    for (const r of ramps.list) {
      const u = t.s - r.s; if (u < 0 || u > RAMP.LEN) continue;
      const lo = Math.max(t.x - hw, r.x - r.w / 2), hi = Math.min(t.x + hw, r.x + r.w / 2), cov = clamp((hi - lo) / (2 * hw), 0, 1);
      if (cov < 0.12) continue;
      return { r, h: RAMP.H * u / RAMP.LEN, cov, side: Math.sign(r.x - t.x) || 1 };
    }
    return null;
  }
  function drive(t, dt) {
    const racing = G.phase === "race" && !t.done, o = T[1 - t.i];
    let inp = { steer: 0, boost: 0, brake: 0 };
    if (racing && t.spinT <= 0 && !(t.stallT > 0)) inp = input(t);
    else if (G.phase === "end") { const tx = TEAMS[t.i].lanes[t.aiLane]; inp = { steer: clamp((tx - t.x) * 0.5 - t.vx * 0.2, -1, 1), boost: 0, brake: G.t - G.endT > 1.2 ? 1 : 0 }; }
    t.inp = inp;
    t.steer += (inp.steer - t.steer) * Math.min(1, dt * 10);
    const brakeEdge = inp.brake && !t.brakeHeld; t.brakeHeld = !!inp.brake;

    if (t.air) flyStep(t, dt, inp, brakeEdge);
    else {
      const braking = !!inp.brake || t.brakeT > 0;
      if (t.brakeT > 0) t.brakeT -= dt;
      // KÉO GẦN: xe sau được bù tốc, xe trước bị hãm (không dưới VMIN) — chỉ khi đang đua và cả 2 còn chạy
      const gap = o.s - t.s, live = racing && !o.done;
      const behind = live ? smooth(PHYS.CATCH, PHYS.CATCH + PHYS.CATCH_K, gap) : 0, ahead = live ? smooth(PHYS.CATCH, PHYS.CATCH + PHYS.CATCH_K, -gap) : 0;
      // mẫu 3c: tốc độ NỀN luôn có; BOOST chỉ chạy khi đạp + còn năng lượng tích trữ (dùng dần BUSE ô/giây)
      const vBase = (racing ? PHYS.VBASE : 0) + 5 * behind;                          // 3q: nền 35 km/h ⇒ bù +18 km/h (cũ +43)
      const nitroOn = !!inp.boost && t.E > 0.5 && racing;
      if (nitroOn) t.E = Math.max(0, t.E - PHYS.BUSE * SEG * dt);
      let vT = nitroOn ? PHYS.VBOOST + 4 * behind : vBase;
      vT = Math.max(vT * (1 - 0.3 * ahead), racing ? PHYS.VMIN : 0);
      if (t.pushT > 0) t.pushT -= dt;
      if (live && -gap > PHYS.GAP_MAX) vT = Math.min(vT, Math.max(o.v, PHYS.VMIN * 0.6));    // trần cứng: không bỏ xa quá 150 m
      if (t.lbT > 0) { t.lbT -= dt; vT += 12; }                                      // Landing Boost
      if (!racing && G.phase !== "end") vT = 0;
      let a = 0;
      if (t.spinT > 0 || t.stallT > 0) a = -26;                                      // trúng tên lửa: xoay + DỪNG tạm (3q: + đứng yên stallT)
      else if (braking) a = G.phase === "end" ? -9 : -PHYS.BRAKE;
      else if (t.v < vT - 0.05) a = Math.min((nitroOn || t.lbT > 0 ? 20 : PHYS.ACC) * (1 - 0.25 * t.v / PHYS.VNITRO), (vT - t.v) / dt);
      else if (t.v > vT + 0.05) a = t.pushT > 0 ? -clamp((t.v - vT) * 0.3, 0.6, 4) : -clamp((t.v - vT) * 1.6, 3, PHYS.HARD);   // vừa bị húc đẩy ⇒ giữ đà lâu hơn
      if (!nitroOn && t.spinT <= 0 && rampContact(t)) a -= 9.8 * Math.sin(RAMP_SLOPE) * 3.2;            // leo dốc KHÔNG boost ⇒ trọng lực hãm (≈ −5,3 m/s²)
      t.v = Math.max(0, t.v + a * dt); t.a = a;
      t.nitroK = lerp(t.nitroK, nitroOn ? 1 : 0, 1 - Math.exp(-dt * 8));
      // ngang: lái liên tục trên CẢ mặt đường; đứng yên thì không lách ngang được; px = lực đẩy ngoài (va chạm) tắt dần
      const latK = clamp(t.v / 8, 0, 1), vxT = (t.spinT > 0 ? 0 : t.steer) * PHYS.LAT * latK;
      t.vx += (vxT - t.vx) * Math.min(1, dt * 7);
      // 3k: LỰC VĂNG khúc cua — cua phải ⇒ trôi sang trái (và ngược lại), mạnh theo độ cong × tốc độ; người cầm lái được trợ 20 %
      const kp = (kapAt(t.s + 10) + kapAt(t.s + 30)) / 2, help = t.src === "ai" ? 0 : PHYS.ASSIST;
      const cxT = racing && !t.done ? -clamp(kp * t.v * PHYS.DRIFT, -3.5, 3.5) * (1 - help) : 0;
      t.cx += (cxT - t.cx) * Math.min(1, dt * 3);
      t.yaw = lerp(t.yaw, -Math.atan2(t.vx + t.px * 0.5 + t.cx * 0.6, Math.max(t.v, 5)) * 0.9, 1 - Math.exp(-dt * 8));
      t.brake = braking || t.spinT > 0 ? 1 : a < -2 ? 0.35 : 0;
      t.boostK = lerp(t.boostK, a > 0.5 || nitroOn ? (inp.boost ? 1 : 0.35) : 0, 1 - Math.exp(-dt * 8));
      if (t.smokeBlack > 0) {                               // trả lời sai ⇒ xì khói ĐEN từ ống xả
        t.smokeBlack -= dt; t.smokeT2 = (t.smokeT2 || 0) - dt;
        if (t.smokeT2 <= 0) { t.smokeT2 = 0.03; [-0.42, 0.42].forEach(k => missiles.dark.emit(t.x + k, 0.4, -t.s + 2.5, (Math.random() - 0.5) * 1.2, 0.6 + Math.random(), 1.5 + Math.random() * 2, 1.1 + Math.random() * 0.6, 0.75, 0.8, 2.2, 0.9)); }
      }
      if (((braking && t.v > 8) || t.spinT > 0) && t.v > 3) { t.smokeT -= dt; if (t.smokeT <= 0) { t.smokeT = 0.03; [-0.8, 0.8].forEach(k => missiles.smoke.emit(t.x + k, 0.25, -t.s + 1.3, (Math.random() - 0.5) * 1.6, 0.6 + Math.random() * 0.9, 2 + Math.random() * 3, 1.1 + Math.random() * 0.8, 0.9, 0.42, 2.6, 0.9)); } }
    }
    const s0 = t.s, ds = t.v * dt; t.s += ds;
    t.x += (t.vx + t.px + (t.air ? 0 : t.cx)) * dt; t.px *= Math.exp(-dt * 2.2);
    // cầu nhảy: trên dốc ⇒ cao theo mặt dốc; vừa qua mép ⇒ CẤT CÁNH
    if (!t.air) {
      const rp = rampContact(t);
      if (rp) {
        t.ramp = rp.r; t.rampPart = rp.cov < 0.85 ? rp.side : 0;
        if (t.rampPart) { t.y = rp.h * 0.5; t.ap = RAMP_SLOPE * 0.5; t.ar = rp.side * Math.atan2(rp.h, cars[t.i].M.W); }   // bánh 1 bên trên dốc ⇒ xe NGHIÊNG
        else { t.y = rp.h; t.ap = RAMP_SLOPE; t.ar = 0; }
      }
      else if (t.ramp) {
        const r = t.ramp; t.ramp = null;
        if (s0 <= r.s + RAMP.LEN + 0.01 && t.s >= r.s + RAMP.LEN - 0.6) { if (t.v < LOW_V) lowDrop(t); else takeOff(t, t.rampPart); }   // 3q
        else { t.y = 0; t.ap = 0; t.ar = 0; }                                                   // lách ra khỏi dốc giữa chừng ⇒ rớt xuống
      } else { t.y = 0; t.ap = lerp(t.ap, 0, 1 - Math.exp(-dt * 10)); }
    }
    // rào hộ lan 2 mép đường
    if (t.x < -ROADX || t.x > ROADX) {
      const side = t.x < -ROADX ? -1 : 1; t.x = clamp(t.x, -ROADX, ROADX); t.vx = -side * 0.6; t.px = -side * Math.min(Math.abs(t.px) * 0.3, 1.5);
      if (t.v > 3 && !t.air) { t.v *= 1 - 1.2 * dt; if (Math.random() < 0.7) missiles.sparks.emit(t.x + side * 1.0, 0.5, -t.s + (Math.random() - 0.5) * 2, side * 2, 2 + Math.random() * 3, 3 + Math.random() * 4, 0.35, 0.12, 1, 0, 1); }
    }
    // văng đuôi (va chạm / đáp đất xấu): lò xo tắt dần
    t.ykV += (-26 * t.yk - 6 * t.ykV) * dt; t.yk += t.ykV * dt;
    if (t.spinT <= 0 && t.stallT > 0) t.stallT = Math.max(0, t.stallT - dt);   // 3q
    if (t.spinT > 0) { t.spinT = Math.max(0, t.spinT - dt); if (t.spinT === 0) { t.yk += wrapPI(t.spinTurns * TAU); t.ykV = 0; } }   // vòng lẻ còn dư ⇒ lò xo kéo về dần
    t.hy += t.hopV * dt; t.hopV -= 14 * dt; if (t.hy <= 0) { t.hy = 0; t.hopV = 0; } t.hitRoll *= Math.exp(-dt * 2.5);
    t.shake = Math.max(0, t.shake - dt * 1.6); t.blurB = Math.max(0, t.blurB - dt * 1.8);
    if (G.winner < 0 && G.phase === "race" && t.s >= FIN) finish(t.i);
    // qua mốc vòng
    const lap = Math.min(LAPS, Math.floor(t.s / LAP) + 1);
    if (G.phase === "race" && lap > t.lapShown) { t.lapShown = lap; toast(t.i, lap === LAPS ? "FINAL LAP!" : "LAP " + lap, "info"); }
  }
  function takeOff(t, part = 0) {
    t.air = true; t.airT = 0; t.v = Math.min(t.v * AIR.BOOST, PHYS.VNITRO * 1.15);              // +20 % tốc độ ngay lúc rời mép dốc
    t.vy = Math.min(8.2, AIR.VY0 + t.v * Math.sin(RAMP_SLOPE) * AIR.VYK + t.v * 0.035);                     // lực phóng LÊN + TỚI (không chỉ quán tính dốc)
    t.y = RAMP.H; t.ap = RAMP_SLOPE; t.ar = 0; t.ay = 0; t.flip = 0; t.flipGoal = null; t.bad = false;
    t.shake = Math.max(t.shake, 0.55); t.blurB = 1;
    t.forced = false;
    if (part) {                                             // chỉ 1 bên xe trên dốc ⇒ bị hất LỘN 1 VÒNG quanh trục DỌC xe (barrel roll), tự xong trước khi chạm đất
      const ar0 = part * Math.atan2(RAMP.H, cars[t.i].M.W);
      t.y = RAMP.H * 0.5; t.ap = RAMP_SLOPE * 0.5; t.ar = ar0; t.vy *= 0.7;
      t.forced = true; t.flip = 2; t.flipDir = part; t.flipGoal = part * TAU;
      const airEst = (t.vy + Math.sqrt(t.vy * t.vy + 2 * AIR.G * t.y)) / AIR.G + 0.25;
      t.rollW = clamp((TAU - Math.abs(ar0)) / (airEst * 0.78), 4, 12);
    }
    onEvent("takeoff", { team: t.i, v: +t.v.toFixed(1) });
  }
  // 3q: dưới 40 km/h ⇒ xe chỉ RƠI qua mép dốc như chạy đường thường: không lực phóng, không +20 % tốc độ, không camera bay, không lộn vòng
  function lowDrop(t) {
    t.air = true; t.low = true; t.airT = AIR.LIFT_T; t.vy = 0; t.y = RAMP.H; t.ar = 0; t.ay = 0; t.flip = 0; t.flipGoal = null; t.bad = false; t.forced = false;
  }
  function flyStep(t, dt, inp, brakeEdge) {
    t.airT += dt;
    t.vy -= (t.airT < AIR.LIFT_T ? AIR.GUP : AIR.G) * dt; t.y += t.vy * dt;
    t.a = 0; t.boostK = lerp(t.boostK, 0.3, 1 - Math.exp(-dt * 4)); t.brake = 0;
    // điều khiển nhẹ: ◀ ▶ = nghiêng (roll) + lượn hướng (yaw) + trôi ngang chút
    t.vx += inp.steer * 2.2 * dt;
    if (!t.flip && !t.bad && !t.low) t.ar += inp.steer * AIR.ROLL * dt;                       // 3f: chỉ nghiêng thân, không lượn hướng (không xoay ngang)
    // PHANH trên không = xoay tròn: phanh thẳng ⇒ Flat Spin (quanh trục đứng) · phanh + lái ⇒ Barrel Roll (quanh trục dọc)
    if (inp.brake && !t.bad && !t.low && !t.flip && !t.forced && Math.abs(inp.steer) > 0.35) { t.flip = 2; t.flipDir = Math.sign(inp.steer); t.flipGoal = null; }   // 3f: chỉ PHANH + LÁI = lộn trục dọc; phanh không thì không xoay
    if (t.flip) {
      const w = (t.forced ? t.rollW : AIR.ROT) * t.flipDir * dt;
      if (inp.brake && !t.forced) t.flipGoal = null;
      else if (t.flipGoal == null) { const cur = t.flip === 1 ? t.ay : t.ar; t.flipGoal = (t.flipDir > 0 ? Math.ceil(cur / TAU - 0.02) : Math.floor(cur / TAU + 0.02)) * TAU; }   // nhả phanh ⇒ tự xoay NỐT tới vòng trọn
      if (t.flip === 1) t.ay += w; else t.ar += w;
      if (t.flipGoal != null) { const cur = t.flip === 1 ? t.ay : t.ar; if ((t.flipGoal - cur) * t.flipDir <= 0) { if (t.flip === 1) t.ay = t.flipGoal; else t.ar = t.flipGoal; t.flip = 0; t.flipGoal = null; t.forced = false; } }
    } else if (!inp.steer) {                                                                          // tự cân nhẹ về thăng bằng (vòng trọn gần nhất)
      const k = 1 - Math.exp(-dt * 2.4); t.ar += (Math.round(t.ar / TAU) * TAU - t.ar) * k * 0.6; t.ay += (Math.round(t.ay / TAU) * TAU - t.ay) * k * 0.35;
    }
    // chúc mũi theo quỹ đạo (đầu bay ngóc lên, cuối hơi chúc) — nhẹ để mặc định đáp được
    t.ap = lerp(t.ap, Math.atan2(t.vy, Math.max(t.v, 8)) * 0.45, 1 - Math.exp(-dt * 3));
    if (t.y <= 0 && t.vy < 0) land(t);
  }
  function land(t) {
    const eP = Math.abs(t.ap), eR = Math.abs(wrapPI(t.ar)), eY = Math.abs(wrapPI(t.ay)), err = Math.max(eP, eR, eY);
    const rots = Math.max(0, Math.round(Math.abs(t.ay) / TAU - 0.15)) + Math.max(0, Math.round(Math.abs(t.ar) / TAU - 0.15));
    const wasBad = t.bad, name = spinName(t);
    if (t.low) {                                             // 3q: rơi qua mép dốc lúc chậm ⇒ chạm đất nặng: rung màn mạnh, vệt lốp, thân xe chông chênh
      t.low = false; t.air = false; t.y = 0; t.vy = 0; t.airT = 0; t.ap = 0; t.ar = 0; t.ay = 0;
      t.markT = 0.55; t.wobT = 0; t.wobA = 0.06 * (Math.random() < 0.5 ? -1 : 1); t.shake = Math.max(t.shake, 0.95); t.blurB = Math.max(t.blurB, 0.35);
      onEvent("land", { team: t.i, kind: "drop", rots: 0, err: 0 });
      return;
    }
    t.air = false; t.y = 0; t.vy = 0; t.airT = 0; t.flip = 0; t.flipGoal = null; t.forced = false;
    t.markT = 0.55; t.wobT = 0;                                                      // 3j: vệt lốp khi chạm đất + thân xe chông chênh
    t.wobA = (wasBad ? 0.07 : 0.05 + (Math.abs(t.ar) > 1 ? 0.07 : 0) + (Math.abs(t.ay) > 1 ? 0.03 : 0)) * (Math.random() < 0.5 ? -1 : 1);
    if (wasBad) { t.bad = false; t.ap = 0; t.ar = 0; t.ay = 0; t.shake = Math.max(t.shake, 0.4); return; }   // cú nảy sau đáp xấu
    const X = t.x, Z = -t.s;
    if (err < AIR.OK) {
      const perfect = err < AIR.PERFECT;
      if (rots > 0) t.E = Math.min(PHYS.CAP * SEG, t.E + SEG * (0.6 * rots + (perfect ? 0.25 : 0)));   // xoay 360 ⇒ nạp thanh BOOST
      if (perfect) {
        t.lbT = 1.0; t.v += 8; t.shake = Math.max(t.shake, 0.55); t.blurB = 0.9;
        for (let k = 0; k < 28; k++) { const sd = k % 2 ? 1 : -1; missiles.sparks.emit(X + sd * 0.8, 0.15, Z + 1.4, sd * (1 + Math.random() * 3), 1 + Math.random() * 4, 4 + Math.random() * 8, 0.4 + Math.random() * 0.3, 0.14, 1, 0, 1); }
        [-0.8, 0.8].forEach(k => { for (let n = 0; n < 6; n++) missiles.smoke.emit(X + k, 0.3, Z + 1.5, (Math.random() - 0.5) * 2, 0.5 + Math.random(), 3 + Math.random() * 3, 1.0 + Math.random() * 0.6, 1.0, 0.5, 2.8, 1); });
        toast(t.i, rots > 0 ? `PERFECT! ${name} ×${rots} +BOOST` : "PERFECT LANDING!", "ok");
      } else { t.shake = Math.max(t.shake, 0.45); if (rots > 0) toast(t.i, `${name} ×${rots} +BOOST`, "ms"); }
      t.ap = 0; t.ar = 0; t.ay = 0;
      onEvent("land", { team: t.i, kind: perfect ? "perfect" : "ok", rots, err: +(err * 180 / Math.PI).toFixed(1) });
    } else {                                                                                                // đáp nghiêng / lật ⇒ mất đà, nảy, nổ nhỏ, văng đuôi
      t.v *= 0.45; t.bad = true; t.air = true; t.vy = 3.4; t.y = 0.02; t.airT = AIR.LIFT_T;
      t.yk = clamp(wrapPI(t.ay), -1.2, 1.2) || (Math.random() < 0.5 ? -0.7 : 0.7); t.ykV = 0; t.ay = 0; t.ar = 0; t.ap = 0.12;
      t.shake = 1; t.blurB = 0.7; missiles.boom(X, Z, "miss");
      for (let k = 0; k < 30; k++) missiles.sparks.emit(X + (Math.random() - 0.5) * 2, 0.3, Z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 10, 2 + Math.random() * 6, (Math.random() - 0.5) * 10, 0.5, 0.15, 1, 0, 1);
      toast(t.i, "BAD LANDING!", "bad");
      onEvent("land", { team: t.i, kind: "bad", rots, err: +(err * 180 / Math.PI).toFixed(1) });
    }
  }
  const spinName = t => Math.abs(t.ar) > Math.abs(t.ay) ? "BARREL ROLL" : "360 SPIN";

  // ---------- va chạm 2 xe: 2 hình chữ nhật xoay trên mặt đường (x, s) — SAT + xung lực ----------
  function collide() {
    const A = T[0], B = T[1]; if (Math.abs(A.y - B.y) > 1.1) return;
    const MA = cars[0].M, MB = cars[1].M, hwa = MA.W / 2 + 0.04, hla = MA.L / 2, hwb = MB.W / 2 + 0.04, hlb = MB.L / 2;   // 3i: mỗi xe một cỡ
    const ya = A.yaw + A.yk, yb = B.yaw + B.yk;
    const fa = [-Math.sin(ya), Math.cos(ya)], ra = [Math.cos(ya), Math.sin(ya)], fb = [-Math.sin(yb), Math.cos(yb)], rb = [Math.cos(yb), Math.sin(yb)];
    const d = [B.x - A.x, B.s - A.s];
    if (d[0] * d[0] + d[1] * d[1] > 36) return;
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
    let best = 1e9, n = null;
    for (const ax of [fa, ra, fb, rb]) {
      const pa = hla * Math.abs(dot(fa, ax)) + hwa * Math.abs(dot(ra, ax)), pb = hlb * Math.abs(dot(fb, ax)) + hwb * Math.abs(dot(rb, ax));
      const dd = dot(d, ax), ov = pa + pb - Math.abs(dd);
      if (ov <= 0) return;
      if (ov < best) { best = ov; n = dd >= 0 ? ax : [-ax[0], -ax[1]]; }
    }
    // tách: mỗi xe lùi nửa độ chồng theo pháp tuyến
    A.x -= n[0] * best / 2; A.s -= n[1] * best / 2; B.x += n[0] * best / 2; B.s += n[1] * best / 2;
    const ua = [A.vx + A.px, A.v], ub = [B.vx + B.px, B.v], vn = (ub[0] - ua[0]) * n[0] + (ub[1] - ua[1]) * n[1];
    const P = [(A.x + B.x) / 2, (A.s + B.s) / 2];                // điểm va (gần đúng)
    if (vn < 0) {
      const e = 0.28, j = -(1 + e) * vn / 2;
      // dọc: đổi thẳng tốc độ chạy; ngang: thành lực đẩy px (tắt dần) ⇒ "ép" được nhau
      A.v = Math.max(0, A.v - j * n[1]); B.v = Math.max(0, B.v + j * n[1]);
      A.px -= j * n[0] * 1.15; B.px += j * n[0] * 1.15;
      if (Math.abs(n[1]) > 0.55) {                         // HÚC ĐUÔI: xe trước được ĐẨY vọt + giữ đà, xe sau khựng (khuyến khích tấn công)
        const front = n[1] > 0 ? B : A, rear = front === A ? B : A;
        front.v += 2 + j * 0.35; front.pushT = 1.3; rear.v = Math.max(0, rear.v - 1.5 - j * 0.4); rear.brakeT = Math.max(rear.brakeT, 0.15);
      }
      // văng đuôi theo điểm va (mô-men = r × J)
      const kick = (t, sgn) => { const r = [P[0] - t.x, P[1] - t.s], Jx = sgn * j * n[0], Js = sgn * j * n[1]; t.ykV += clamp((r[0] * Js - r[1] * Jx) * 0.11, -3.5, 3.5); };
      kick(A, -1); kick(B, 1);
      const hard = clamp(j / 7, 0, 1);
      A.shake = Math.max(A.shake, 0.25 + 0.6 * hard); B.shake = Math.max(B.shake, 0.25 + 0.6 * hard);
      for (let k = 0; k < 6 + 30 * hard; k++) missiles.sparks.emit(P[0], 0.55, -P[1], (Math.random() - 0.5) * 8, 1 + Math.random() * 4, (Math.random() - 0.5) * 8 + 3, 0.35 + Math.random() * 0.3, 0.14, 1, 0, 1);
      if (j > 2.2 && G.t - G.bumpT > 1.1 && G.phase === "race") {
        G.bumpT = G.t; const word = j > 7 ? "SLAM!" : "BUMP!";
        [0, 1].forEach(i => { if (G.t - toastAt[i] > 0.8) toast(i, word, "info"); });
      }
      onEvent("bump", { j: +j.toFixed(2), n: n.map(v => +v.toFixed(2)) });
    } else if (Math.abs(ub[1] - ua[1]) > 1.5 && Math.random() < 0.5) {      // cọ hông khi chạy song song ⇒ tia lửa
      missiles.sparks.emit(P[0], 0.5, -P[1], (Math.random() - 0.5) * 4, 1 + Math.random() * 2, 4, 0.3, 0.12, 1, 0, 1);
    }
  }

  // ---------- máy quay ----------
  const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), V4 = new THREE.Vector3(), V5 = new THREE.Vector3(), V6 = new THREE.Vector3();
  let camOverride = null;
  function updateCams(dt) {
    T.forEach((t, i) => {
      const car = cars[i], cam = cams[i];
      const want = G.phase === "menu" ? 0 : G.phase === "count" ? ease(clamp((G.countT - 0.3) / 2.6, 0, 1)) : G.phase === "end" && G.t - G.endT > 2.2 ? 0 : 1;
      t.camK = G.phase === "count" ? want : lerp(t.camK, want, 1 - Math.exp(-dt * 2.2));
      // jk: máy quay NHẢY — trên không lùi RA NGOÀI, thấp, rộng (FOV +18 %); đáp đất thì về lại ghế lái
      t.jk = lerp(t.jk, t.air && !t.bad && !t.low ? 1 : 0, 1 - Math.exp(-dt * (t.air ? 13 : 8)));   // 3c: chuyển góc NHANH hơn
      car.body.updateMatrixWorld(true);
      const eyeC = car.body.localToWorld(V1.copy(car.eye || EYE)), lookC = car.body.localToWorld(V2.copy(car.look || LOOK));   // 3j: mắt tài xế theo từng xe
      const orb = G.t * 0.22 + i * 2.1, back = G.phase === "end" ? 9 : 7.2;
      const fx = -Math.sin(t.yaw), fz = -Math.cos(t.yaw);         // máy quay ngoài chỉ theo HƯỚNG CHẠY (không theo cú xoay của xe)
      const eyeF = V3.set(t.x - fx * back + Math.sin(orb) * 2.6, t.y + (G.phase === "end" ? 3.2 : 2.3), -t.s - fz * back), lookF = V4.set(t.x + fx * 3, t.y * 0.6 + 0.9, -t.s + fz * 3);
      const side = i ? 2.0 : -2.0;
      const eyeJ = V5.set(t.x + side - fx * 8.6, 0.8 + t.y * 0.35, -t.s - fz * 8.6), lookJ = V6.set(t.x + fx * 5, 0.5 + t.y * 1.0, -t.s + fz * 5);   // nhìn ngay xe ⇒ xe nằm quanh đường chân trời
      const k = t.camK, j = t.jk * k;
      cam.position.lerpVectors(eyeF, eyeC, k).lerp(eyeJ, j);
      const look = eyeF.copy(lookF).lerp(lookC, k).lerp(lookJ, j);
      const sh = (0.006 * smooth(20, 47, t.v) + 0.075 * t.shake) * Math.max(k, 0.4);
      if (sh > 0.0005) { cam.position.x += (Math.random() - 0.5) * sh; cam.position.y += (Math.random() - 0.5) * sh; }
      if (camOverride && camOverride[i]) { cam.position.fromArray(camOverride[i].pos); look.fromArray(camOverride[i].look); }
      cam.lookAt(look);
      cam.rotateZ((car.body.rotation.z * 0.9 - t.steer * 0.025) * k * (1 - t.jk));
      let fov = lerp(62, 80 + 10 * smooth(PHYS.CRUISE * 0.6, PHYS.VBOOST, t.v) + 3 * t.boostK + 5 * t.nitroK, k);
      fov *= 1 + 0.18 * t.jk;
      if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; lens(cam); }
      cam.layers.set(0); cam.layers.enable(2 - i);
      if (k * (1 - t.jk) > 0.86) cam.layers.enable(3 + i); else cam.layers.enable(1 + i);
      if (G.cineW >= 0) cine(i, cam);
      cam.updateMatrixWorld();
    });
  }
  // về đích: nửa TRÁI quay vòng quanh xe thắng (từ chếch trước ra hông), nửa PHẢI đặt thấp sau cổng đích nhìn xe lao tới
  function cine(i, cam) {
    const w = T[G.cineW], p = clamp(1 - G.slow / SLOW_T, 0, 1);
    if (i === 0) { const ang = lerp(2.5, 1.0, ease(p)); cam.position.set(w.x + Math.sin(ang) * 9.5, w.y + 1.2 + 0.8 * p, -w.s + Math.cos(ang) * 9.5); }
    else cam.position.set(w.x > 0 ? -7.5 : 7.5, 0.7, -FIN - 11);
    cam.lookAt(w.x, w.y + 0.7, -w.s);
    if (Math.abs(cam.fov - 40) > 0.01) { cam.fov = 40; lens(cam); }
    cam.layers.set(0); cam.layers.enable(1); cam.layers.enable(2);
  }
  const LENS = { A: 1.2, full: 1.4 };
  function lens(cam) {
    const yh = HORIZON * (1 - dashF), below = 1 - yh;
    LENS.full = 2 * below;
    cam.aspect = LENS.A / LENS.full;
    cam.setViewOffset(LENS.A, LENS.full, 0, below - yh, LENS.A, 1);
  }

  // ---------- bản đồ đường vòng + cong 3D theo khúc cua ----------
  const curve = new THREE.CatmullRomCurve3(MAP_PTS.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal");
  const MAPN = 400, MP = curve.getSpacedPoints(MAPN).slice(0, MAPN).map(v => [v.x, v.y]);
  const KAP = (() => {                                       // độ cong (rad / m thế giới) tại từng điểm — dương = cua PHẢI (chiều kim đồng hồ trên màn)
    const th = MP.map((p, k) => { const q = MP[(k + 1) % MAPN]; return Math.atan2(q[1] - p[1], q[0] - p[0]); });
    const raw = th.map((a, k) => wrapPI(th[(k + 1) % MAPN] - a) / (LAP / MAPN));
    return raw.map((_, k) => { let s = 0; for (let d = -6; d <= 6; d++) s += raw[(k + d + MAPN) % MAPN]; return s / 13; });
  })();
  const lapU = s => (((s % LAP) + LAP) % LAP) / LAP;
  const mapAt = s => { const f = lapU(s) * MAPN, k = Math.floor(f) % MAPN, u = f - Math.floor(f), a = MP[k], b = MP[(k + 1) % MAPN]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
  const kapAt = s => KAP[Math.floor(lapU(s) * MAPN) % MAPN];
  function bendFor(i) {                                      // khúc cua 3D lấy từ độ cong bản đồ ~30–150 m phía trước (+ đổ dốc nhẹ như mẫu 2)
    const S = T[i].s, amt = opt.bend * (G.phase === "menu" ? 0.5 : 1);
    let k = 0; for (let d = 30; d <= 150; d += 30) k += kapAt(S + d); k /= 5;
    return [clamp(k * 0.085, -0.0024, 0.0024) * amt, (0.00012 + 0.0001 * Math.sin(S / 170 + 0.4)) * amt];
  }
  const bxS = [0, 0], bxT = [0, 0];
  function prepView(i, hPx) {
    const cam = cams[i], [bx, by] = bendFor(i);
    const now = performance.now(), dt = bxT[i] ? Math.min(0.1, (now - bxT[i]) / 1000) : 1 / 60; bxT[i] = now;
    bxS[i] = lerp(bxS[i], bx, 1 - Math.exp(-dt * 3.2));       // 3q: khúc cua vào dần theo GIÂY THẬT (cũ: 0,08 mỗi khung ⇒ máy nhanh xoay nhanh)
    U.uBend.value.set(bxS[i], by); U.uBendZ.value = cam.position.z;
    world.update(cam.position, G.t, Math.min(T[0].s, T[1].s) - 30, Math.max(T[0].s, T[1].s));
    missiles.setScale(hPx * LENS.full / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))));
  }
  const mapSvg = $(".sr-map svg");
  const dPath = "M" + MP.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
  const sf = (() => { const a = MP[0], b = MP[3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; return `translate(${a[0].toFixed(1)} ${a[1].toFixed(1)}) rotate(${ang.toFixed(1)})`; })();
  mapSvg.innerHTML = `<path d="${dPath}" class="m-edge"/><path d="${dPath}" class="m-road"/><path d="${dPath}" class="m-mid"/>
    ${Array.from({ length: L - 1 }, (_, k) => { const u = lapU((k + 1) * SEG); if (u < 0.01 || u > 0.99) return ""; const [x, y] = mapAt((k + 1) * SEG); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" class="m-tick"/>`; }).join("")}
    ${ramps.list.filter(r => r.s < LAP).map(r => { const [x, y] = mapAt(r.s + RAMP.LEN); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" class="m-ramp"><path d="M-9 6 L0 -9 L9 6 Z"/></g>`; }).join("")}
    <g transform="${sf}"><rect x="-3" y="-17" width="6" height="34" class="m-start"/></g>
    <g class="m-ms"></g>
    ${[0, 1].map(i => `<g class="m-car" data-i="${i}"><circle r="15" fill="${TEAMS[i].color}"/><text text-anchor="middle" dominant-baseline="central">${i + 1}</text></g>`).join("")}`;
  const mapCars = [...mapSvg.querySelectorAll(".m-car")], mapMs = mapSvg.querySelector(".m-ms"), gapEl = $(".sr-gap"), lapEl = $(".sr-lap");

  // ---------- HUD ----------
  const PJ = new THREE.Vector3();
  let hudT = 0, infoT = 0;
  const blurK = [0, 0];
  function updateHUD(dt) {
    { const R = G.round; if (R && R.dl != null && R.wait >= 0) { const e = qboxes[R.wait].querySelector(".rw-wait em"); if (e) e.style.transform = `scaleX(${clamp((R.dl - G.t) / R.win, 0, 1).toFixed(3)})`; } }   // 3q
    T.forEach((t, i) => {
      const [x, y] = mapAt(t.s); mapCars[i].setAttribute("transform", `translate(${x.toFixed(1)} ${(y + (i ? 6 : -6)).toFixed(1)})`);
      const h = H[i];
      h.wheel.style.transform = `rotate(${(t.steer * 70 + (t.spinT > 0 ? Math.sin(G.t * 40) * 6 : 0)).toFixed(1)}deg)`;
      const o = T[1 - i], cam = cams[i], d = Math.min(-o.s - cam.position.z, 0);
      const bq = bendQ(d); PJ.set(o.x + bxS[i] * bq, 2.0 + o.y - bendFor(i)[1] * bq, -o.s);   // 3q: cùng công thức cong của shader
      // 3r: SỬA LỖI 3q — dòng dưới bị nuốt vào chú thích ⇒ xe kia cách ~60–120 m trong khung nhìn ⇒ ReferenceError `dist` MỖI khung, ném ra trước
      //   composer.render() ⇒ khung đó KHÔNG được vẽ (hình đứng trong lúc rAF vẫn chạy).
      const dist = PJ.distanceTo(cam.position); PJ.project(cam);
      const yTop = (1 - PJ.y) / 2, show = G.phase === "race" && PJ.z < 1 && Math.abs(PJ.x) < 0.98 && yTop > 0.05 && yTop < 1 - dashF - 0.04 ? smooth(14, 40, dist) : 0;
      h.tag.style.opacity = show.toFixed(2);
      if (show > 0) { h.tag.style.left = ((PJ.x + 1) / 2 * 100).toFixed(2) + "%"; h.tag.style.top = (yTop * 100).toFixed(2) + "%"; }
      const inc = missiles.incoming(i); t.inc = inc;
      h.el.classList.toggle("is-alarm", !!inc); h.el.classList.toggle("is-locked", !!(inc && inc.locked));
      if (inc) { h.alarmBar.style.transform = `scaleX(${clamp(inc.tLeft / MS.T, 0, 1).toFixed(3)})`; }
      h.el.classList.toggle("is-air", t.jk > 0.3); h.el.classList.toggle("is-nitro", t.nitroK > 0.3);
      // nhoè: khi bay + lúc cất cánh/đáp đất + khi Nitro / rất nhanh
      blurK[i] = lerp(blurK[i], Math.max(t.jk * 0.75, t.blurB, 0.45 * t.nitroK + 0.25 * smooth(PHYS.VBOOST, PHYS.VNITRO, t.v)), 1 - Math.exp(-dt * 10));
    });
    blurPass.uniforms.uK.value.set(blurK[0], blurK[1]);
    blurPass.enabled = blurK[0] > 0.004 || blurK[1] > 0.004;   // 3r: không nhoè ⇒ bỏ hẳn lượt vẽ toàn màn này
    const cy = 1 - HORIZON * (1 - dashF); blurPass.uniforms.uC0.value.set(0.25, cy); blurPass.uniforms.uC1.value.set(0.75, cy);
    const act = missiles.active;
    if (mapMs.childElementCount !== act.length) mapMs.innerHTML = act.map(() => `<circle r="8" class="m-msdot"/>`).join("");
    act.forEach((m, k) => { const [x, y] = mapAt(m.P.s); mapMs.children[k].setAttribute("cx", x.toFixed(1)); mapMs.children[k].setAttribute("cy", (y + (m.to ? 6 : -6)).toFixed(1)); });
    hudT -= dt; if (hudT <= 0) {
      hudT = 0.08; paintTouch();
      const lead = T[0].s >= T[1].s ? 0 : 1, gap = Math.abs(T[0].s - T[1].s);
      gapEl.innerHTML = G.phase === "race" || G.phase === "end" ? (gap < 1 ? "NECK AND NECK" : `<b style="color:${TEAMS[lead].color}">${TEAMS[lead].name}</b><br>+${Math.round(gap)} m`) : `${FIN} m`;
      const lapLead = Math.min(LAPS, Math.floor(Math.max(T[0].s, T[1].s) / LAP) + 1);
      lapEl.innerHTML = `<small>LAP</small>${G.phase === "menu" || G.phase === "count" ? 1 : lapLead}/${LAPS}`;
      T.forEach((t, i) => {
        const h = H[i], e = t.E / SEG;
        h.kmh.textContent = Math.round(t.v * 3.6);
        h.cells.forEach((c, k) => c.style.setProperty("--f", clamp(e - k, 0, 1).toFixed(3)));
        const ef = clamp(t.E / (PHYS.CAP * SEG), 0, 1);          // thanh BOOST tích trữ = lớp xanh trong bàn đạp ga
        h.nitro.style.transform = `scaleY(${ef.toFixed(3)})`; h.boost.classList.toggle("has-nitro", t.E > 1);
        if (h.msN !== t.ms && performance.now() > h.msHold) { h.msN = t.ms; h.ms.innerHTML = reserveHTML(Math.max(0, t.ms - 2)); }   // icon chờ = ngoài 2 quả trong nút
        paintSlots(t, h);
        if (h.streak.length !== opt.streak) { const box = h.el.querySelector(".sr-streak"); box.innerHTML = "<i></i>".repeat(opt.streak); box.classList.toggle("is-many", opt.streak > 5); h.streak = [...box.children]; }   // 3q
        h.streak.forEach((s, k) => s.classList.toggle("on", k < t.streak));
        h.fire.classList.toggle("ready", t.ms > 0 && G.phase === "race");
        h.src.textContent = t.src === "pad" ? "iPAD" : t.src === "key" ? "KEYS" : t.src === "touch" ? "TOUCH" : t.src === "test" ? "TEST" : "AUTO";
        h.src.dataset.s = t.padOn ? (t.padSt === "relay" ? "relay" : "on") : "";
        const o = T[1 - i], d = o.s - t.s;
        h.mirDir.textContent = Math.abs(d) < 1 ? "◆" : d > 0 ? "▲" : "▼";
        h.mirTxt.innerHTML = `<b style="color:${TEAMS[1 - i].color}">${TEAMS[1 - i].name}</b> ${Math.abs(d) < 1 ? "level" : (d > 0 ? "ahead " : "behind ") + Math.round(Math.abs(d)) + " m"}`;
        h.tagT.textContent = Math.round(Math.abs(d)) + " m";
        if (t.inc) h.alarmT.textContent = t.inc.locked ? "DODGE!" : t.inc.tLeft.toFixed(1) + " s";
      });
    }
    infoT -= dt; if (infoT <= 0 && remote && remote.send) {
      infoT = 0.25;
      T.forEach((t, i) => { if (t.padOn) remote.send(i, `i:${Math.round(t.v * 3.6)},${(t.E / SEG).toFixed(1)},${t.ms},${t.inc ? (t.inc.locked ? 2 : 1) : 0},${G.phase},${clamp(t.E / (PHYS.CAP * SEG), 0, 1).toFixed(2)}`); });
    }
  }

  // ---------- vòng vẽ ----------
  const AR = makeAutoRes({ max: PR_MAX, min: Math.min(0.7, PR_MAX), key: "rw-3r", apply: pr => { renderer.setPixelRatio(pr); fit(true); } });   // 3r: không nấc MSAA
  let W = 0, Hh = 0;
  function fit(force) {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h || (!force && w === W && h === Hh)) return;
    W = w; Hh = h; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
    dashF = clamp(H[0].dash.offsetHeight / h, 0, 0.6);
    LENS.A = (w / 2) / h; cams.forEach(lens);
  }
  const ro = new ResizeObserver(() => fit()); ro.observe(stage); fit(true);

  // ---------- 3p: dịch sẵn shader + giữ shader sống (TRAIN RUSH 1am / STAR LOOT 2p) ----------
  function pinPrograms() { const ps = renderer.info.programs; if (ps) for (const p of ps) if (!p.__pin3p) { p.__pin3p = true; p.usedTimes++; } }
  let warmP = null, warmInfo = null;
  // 3p: mỗi xe 3 chỗ cháy làm sẵn — từng chỗ một, nghỉ giữa các lần (mỗi lần 6–110 ms) ⇒ không dồn thành một cú đơ
  async function prepBurnsSoft(n = 3) {
    for (let k = 1; k <= n && !dead; k++) {
      for (const c of cars) { if (dead) return; try { c.prepBurns && c.prepBurns(k); } catch (e) { /* */ } await new Promise(r => setTimeout(r, 40)); }
    }
  }
  function prewarm() {
    if (warmP) return warmP;
    warmP = (async () => {
      const t0 = performance.now(), n0 = renderer.info.programs.length; let tC = t0, tR = t0, nC = 0, tT = t0, nT = 0;
      // mẫu những thứ CHỈ sinh lúc đua: tên lửa bay (vòng ngắm, cột sáng, lửa đuôi) · nổ (quả cầu lửa, vết cháy đường) · vết cháy trên thân xe
      try { missiles.launch({ from: 0, to: 1, x: 0, y: -40, z: 0, predict: () => ({ x: 0, s: 0 }) }); missiles.boom(0, 0, "hit"); } catch (e) { /* */ }
      cars.forEach(c => { try { c.burn && c.burn(0); } catch (e) { /* */ } });
      // khoá shader gồm SỐ ĐÈN camera thấy: đèn lửa pô mỗi xe nằm ở lớp của đội ⇒ camera buồng lái (lớp 0 · xe kia · mũi xe mình) thấy 2 đèn điểm,
      // camera ngoài xe / về đích (lớp 0 · 2 xe) thấy 3 ⇒ dịch CẢ HAI kiểu. compile() bỏ qua clippingPlanes của vật liệu ⇒ mũi xe (cắt ở chân kính)
      // phải qua 1 khung vẽ thật với lớp buồng lái.
      const lay = cams.map(c => c.layers.mask), setL = (c, a) => { c.layers.set(a[0]); a.slice(1).forEach(l => c.layers.enable(l)); };
      const LAY = [[0, 2, 3], [0, 1, 4]];                          // buồng lái của đội 0 / đội 1 (= updateCams)
      try {
        // ⚠️ đích vẽ = render target của composer (game KHÔNG vẽ thẳng ra màn) — không thì khoá shader lệch (tone mapping / hệ màu) ⇒ dịch phí
        const cA = l => { setL(cams[0], l); renderer.setRenderTarget(composer.renderTarget1); const p = renderer.compileAsync(scene, cams[0]); renderer.setRenderTarget(null); return p; };
        if (renderer.compileAsync) { await cA([0, 1, 2]); if (!dead) await cA(LAY[0]); if (!dead) await cA(LAY[1]); }   // 3r: + buồng lái đội 2 (2 xe khác số đèn pô ⇒ khác khoá)
        // vật liệu hậu kỳ (bloom: lọc sáng / làm mờ 5 tầng / ghép · nhoè hướng tâm) — vẽ vào render target ⇒ dịch ngầm với đích đó.
        // OutputPass tự đặt define ở lần vẽ đầu ⇒ để khung ẩn lo (1 shader).
        if (renderer.compileAsync && !dead) {
          const pm = new Set(), quad = new THREE.PlaneGeometry(2, 2), sc = new THREE.Scene();
          composer.passes.forEach(p => { if (p instanceof OutputPass) return; Object.values(p).forEach(v => { if (v && v.isMaterial) pm.add(v); else if (Array.isArray(v)) v.forEach(x => x && x.isMaterial && pm.add(x)); }); });
          pm.forEach(m => { const q = new THREE.Mesh(quad, m); q.frustumCulled = false; sc.add(q); });
          renderer.setRenderTarget(composer.renderTarget1); const pp = renderer.compileAsync(sc, cams[0]); renderer.setRenderTarget(null);
          await pp; quad.dispose();
        }
        tC = performance.now(); nC = renderer.info.programs.length;
      } catch (e) { /* dịch lúc vẽ như cũ */ }
      // ảnh (texture) đẩy lên card từng cái một, nghỉ giữa chừng — không dồn vào khung ẩn bên dưới thành một cú đơ dài
      { const tx = new Set(); scene.traverse(o => { (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach(m => { for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.isRenderTargetTexture) tx.add(v); } }); });
        let tq = performance.now(); for (const t of tx) { if (dead) break; try { renderer.initTexture(t); } catch (e) { /* */ } if (performance.now() - tq > 12) { await new Promise(r => setTimeout(r, 0)); tq = performance.now(); } }
        tT = performance.now(); nT = tx.size; }
      if (!dead) { cams.forEach((c, i) => setL(c, LAY[i])); fit(true); composer.render(); }   // khung ẩn: mũi xe (clipping) + bloom / nhoè / output
      cams.forEach((c, i) => { c.layers.mask = lay[i]; }); tR = performance.now();
      pinPrograms();                                             // 3r: GHIM TRƯỚC khi dọn mẫu — dispose vật liệu mẫu (vết cháy, tên lửa) xoá luôn program chưa ghim
      try { missiles.update(10, G.t); missiles.clear(); } catch (e) { /* */ }      //     ⇒ trúng tên lửa lần đầu giữa trận phải dịch lại (đo TOMKO: 2 lần / ván)
      cars.forEach(c => c.clearBurns && c.clearBurns());
      await prepBurnsSoft();                                     // chỗ cháy làm sẵn (trúng tên lửa không phải dò tia giữa trận)
      warmInfo = { ms: Math.round(performance.now() - t0), compile: Math.round(tC - t0), tex: Math.round(tT - tC) + "ms/" + nT, render: Math.round(tR - tT), burns: Math.round(performance.now() - tR), programs: [n0, nC, renderer.info.programs.length] };
    })();
    return warmP;
  }

  const RC = new THREE.Vector3(), RA = new THREE.Vector3();
  let raf = 0, last = 0, manual = false, dead = false, fpsN = 0, fpsT = 0, fps = 0, pinT = 0;
  function frame(dt) {
    if (G.slow > 0) {                                        // SLOW MOTION về đích: vào chậm 0,3 s, ×0,2, ra lại nhanh cuối
      G.slow -= dt; const p = 1 - G.slow / SLOW_T;
      dt *= p < 0.12 ? lerp(1, 0.2, p / 0.12) : p > 0.86 ? lerp(0.2, 1, (p - 0.86) / 0.14) : 0.2;
      if (G.slow <= 0) { G.slow = 0; G.cineW = -1; mount.classList.remove("is-cine"); T.forEach(t => { const c = cams[t.i]; c.fov = 1; }); }
    }
    G.t += dt;
    if (G.phase === "count") G.countT += dt;
    for (let i = G.queue.length - 1; i >= 0; i--) if (G.queue[i].at <= G.t) { const q = G.queue.splice(i, 1)[0]; q.fn(); }
    roundTick();                                             // 3q
    if (G.phase === "race" && G.auto) T.forEach((t, i) => {
      if (!t.lock && t.cur && G.t >= G.nextAuto[i]) {
        const ok = Math.random() < G.acc[i], ks = t.cur.answers.map((a, k) => [a.correct, k]).filter(([c]) => c === ok).map(([, k]) => k);
        answer(i, ks.length ? ks[Math.floor(Math.random() * ks.length)] : 0); G.nextAuto[i] = G.t + 1.4 + Math.random() * 2.6;
      }
      if (t.ms > 0 && G.t >= G.nextFire[i]) { fire(i); G.nextFire[i] = G.t + 2 + Math.random() * 4; }
    });
    if (G.phase === "race" || G.phase === "end") { T.forEach(t => drive(t, dt)); collide(); collide(); }
    else T.forEach(t => { const inp = idleInput(t); t.inp = inp; t.steer += (inp.steer - t.steer) * Math.min(1, dt * 10); });   // iPad/phím/chạm hiện lên game cả lúc chờ
    if (G.phase === "race") for (const [A, B] of [[T[0], T[1]], [T[1], T[0]]]) {          // 3k: xe trước PHANH gấp ngay trước mặt ⇒ xe sau hơi lệch, mất lái nhẹ
      const gap = A.s - B.s;
      if (A.brake > 0.5 && !A.air && !B.air && gap > 2 && gap < 24 && Math.abs(A.x - B.x) < 2.8 && B.v > 10 && G.t >= B.slipCd) { B.slipCd = G.t + 2.4; slip(B, 0.7); }
    }
    if (G.phase === "menu") T.forEach((t, i) => {                                           // 3k: màn chờ — pô nổ: thỉnh thoảng xịt lửa (đôi khi 2 phát liền) + chút khói
      t.popT -= dt;
      if (t.popT <= 0) { t.popT = 2.2 + Math.random() * 3.8; popExhaust(i); if (Math.random() < 0.45) later(0.16 + Math.random() * 0.1, () => G.phase === "menu" && popExhaust(i)); }
    });
    T.forEach(t => { t.popK = Math.max(0, t.popK - dt * 4.5); });
    missiles.update(dt, G.t).forEach(impact);
    T.forEach((t, i) => {
      const c = cars[i]; c.rig.position.set(t.x, t.y + t.hy, -t.s);
      t.wobT += dt; const wob = t.wobT < 2.5 ? t.wobA * Math.exp(-2.6 * t.wobT) * Math.sin(12.5 * t.wobT) : 0;   // 3j: chông chênh tắt dần
      c.rig.rotation.set(t.ap + wob * 0.35 * Math.sin(9 * t.wobT + 1), t.yaw + t.yk + t.ay + (t.spinT > 0 ? t.spinTurns * TAU * ease(1 - t.spinT / t.spinT0) : 0), t.ar + t.hitRoll * Math.min(1, t.hy * 2 + 0.3) + wob);
      c.update(dt, { dist: t.s, accel: t.a, brake: t.brake, steer: t.vx, boost: Math.max(t.boostK, t.nitroK), t: G.t, pop: t.popK });
      c.launcher.update(dt, t.ms);
      const hy = t.ramp ? 0 : t.y, sh = shadows[i];
      sh.position.set(t.x, 0.03 + (t.ramp ? t.y : 0), -t.s); sh.rotation.y = t.yaw + t.yk; sh.scale.setScalar(1 + hy * 0.12); sh.material.opacity = 0.9 / (1 + hy * 0.35);
      // vệt gió: 2 góc sau, đậm khi bay / Nitro / rất nhanh
      const k = Math.max(t.air && !t.bad ? 1 : 0, t.nitroK, 0.5 * smooth(PHYS.VBOOST - 2, PHYS.VNITRO, t.v));
      c.rig.updateMatrixWorld(true);
      const M = c.M;
      c.rig.localToWorld(RA.set(-M.W * 0.42, 0.75, M.L / 2 - 0.1)); c.rig.localToWorld(RC.set(M.W * 0.42, 0.75, M.L / 2 - 0.1));
      trails.push(i, RA, RC, k);
      // 3j: vết lốp — chạm đất sau cú nhảy, bị bắn xoay, phanh gấp ở tốc độ cao (bánh sau; xoay thì cả 4 bánh)
      if (t.markT > 0) t.markT -= dt;
      const onGround = !t.air && t.y < 0.06, skid = onGround && (t.markT > 0 || t.spinT > 0 || (t.brake > 0.5 && t.v > 16));
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], w) => {
        const P = c.rig.localToWorld(SK.set(sx * M.W * 0.36, 0, sz * M.L * 0.31)), key = i * 4 + w, prev = skPrev[key];
        if (skid && (w < 2 || t.spinT > 0)) { if (prev && prev.distanceToSquared(P) > 0.01 && prev.distanceToSquared(P) < 9) skids.seg(prev, P, t.spinT > 0 ? 0.6 : 0.5); skPrev[key] = (prev || new THREE.Vector3()).copy(P); }
        else skPrev[key] = null;
      });
      // 3j: lửa tại chỗ bị bắn trúng (vết cháy đen do sr3d-car-3j hiện dần sau)
      if (t.burnT > 0 && t.burnP) {
        t.burnT -= dt; const k2 = clamp(t.burnT / 0.8, 0, 1);
        c.body.localToWorld(SK.copy(t.burnP).addScaledVector(t.burnN, 0.06));
        for (let n = 0; n < 2; n++) missiles.fire.emit(SK.x + (Math.random() - 0.5) * 0.25, SK.y + 0.05, SK.z + (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 1.6, -t.v * 0.85, 0.28 + Math.random() * 0.25, (0.5 + Math.random() * 0.4) * (0.4 + 0.6 * k2), 0.9, 1.6, 0.4);
        if (Math.random() < 0.5) missiles.dark.emit(SK.x, SK.y + 0.3, SK.z, (Math.random() - 0.5) * 0.4, 1.2 + Math.random(), -t.v * 0.8, 1.2 + Math.random() * 0.8, 0.7, 0.55, 2.4, 0.6);
      }
    });
    updateCams(dt);
    hoods.forEach(h => h.update && h.update());
    updateHUD(dt);
  }
  function loop(now) {
    if (dead) return; raf = requestAnimationFrame(loop);
    if (manual) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60); last = now;
    if (G.hold) return;                                                          // 3n: intro đang chiếu ⇒ không vẽ cảnh đua
    if (++pinT >= 30) { pinT = 0; pinPrograms(); }                                // 3p: giữ shader sống
    fit(); if (!G.paused) frame(dt); composer.render(); AR.frame(now);   // 3j: MENU mở ⇒ đứng hình
    fpsN++; if (now - fpsT > 1000) { fps = fpsN; fpsN = 0; fpsT = now; onEvent("fps", fps); }
  }
  raf = requestAnimationFrame(loop);

  if (remote) remote.attach({
    press: (i, k) => { if (k === "fire") fire(i); },
    drive: (i, d) => { T[i].pad = d; T[i].padT = G.t; },
    status: (i, s) => { T[i].padSt = s; T[i].padOn = s === "on" || s === "relay"; onEvent("pad", { team: i, s }); },
    answer: (i, k, n) => { if (padMode === 1 && T[i].qn === n) answer(i, k); },
  });
  setPadMode(padMode);

  const api = {
    start, toMenu, setPadMode, get padMode() { return padMode; },
    answer: (i, ok) => { const t = T[i]; if (!t.cur) return false; const k = t.cur.answers.findIndex(a => !!a.correct === !!ok); return answer(i, k < 0 ? 0 : k); },
    auto(on = true, a0, a1) { G.auto = on; if (a0 != null) G.acc[0] = a0; if (a1 != null) G.acc[1] = a1; },
    give(i, n = 1) { T[i].E = Math.min(PHYS.CAP * SEG, T[i].E + n * SEG); },
    arm(i, n = 1) { T[i].ms = clamp(n, 0, opt.msMax); },
    nitro(i, k = 1) { T[i].N = clamp(k, 0, 1); },
    hold(v) { G.hold = !!v; if (!v) last = 0; },
    get round() { return G.round; }, opt,                    // 3q: bàn thử
    prewarm, get warm() { return warmInfo; },                // 3p
    // 3o: Options ▸ Apply của AWord. Cùng/khác câu hỏi + số tên lửa áp ngay (true); đường / vòng / cầu nhảy đổi ⇒ false (AWord dựng lại cả game)
    setOptions(o = {}) {
      if (dead) return false;
      if ((o.steps != null && (o.steps | 0) !== L) || (o.laps != null && (o.laps | 0) !== (opt.laps | 0)) || (o.ramps != null && !!o.ramps !== !!opt.ramps)) return false;
      if (o.lives != null && (o.lives | 0) !== (opt.lives | 0)) return false;            // 3q: đổi số mạng ⇒ dựng lại (vạch mới)
      if (typeof o.sameQ === "boolean" && o.sameQ !== opt.sameQ) { if (G.phase === "race") return false; opt.sameQ = o.sameQ; }   // 3q: đổi lượt giữa trận ⇒ dựng lại
      if (o.msDmg >= 1) opt.msDmg = Math.min(5, o.msDmg | 0);
      if (o.tieWait != null) opt.tieWait = o.tieWait;
      if (o.missWait != null) opt.missWait = o.missWait;
      if (o.streak >= 1) opt.streak = Math.min(10, o.streak | 0);
      if (o.msMax >= 0) { opt.msMax = Math.min(10, o.msMax | 0); T.forEach(t => { t.ms = Math.min(t.ms, opt.msMax); }); }
      return true;
    },
    setCar, cars: () => carIds.slice(), carInfo: () => cars.map(c => ({ id: c.id, wheels: c.wheels.length, L: +c.M.L.toFixed(2), W: +c.M.W.toFixed(2), r: +c.M.r.toFixed(2), roof: +c.M.top[0][1].toFixed(2) })), carList: () => XE.map(x => ({ id: x.id, name: x.name })),
    place(i, s, x) { const t = T[i]; if (s != null) t.s = s; if (x != null) t.x = x; t.air = false; t.y = 0; t.ramp = null; },
    fire, drive(i, d) { T[i].manual = d || null; },
    step(n = 1, dt = 1 / 60) { manual = true; for (let k = 0; k < n; k++) frame(dt); fit(true); composer.render(); },
    resume() { manual = false; last = 0; },
    state: () => ({ phase: G.phase, t: +G.t.toFixed(2), winner: G.winner, L, FIN, LAP: +LAP.toFixed(1), LAPS, teams: T.map(t => ({ s: +t.s.toFixed(2), v: +t.v.toFixed(2), kmh: Math.round(t.v * 3.6), x: +t.x.toFixed(2), y: +t.y.toFixed(2), air: t.air, E: +t.E.toFixed(1), cells: +(t.E / SEG).toFixed(2), N: +t.N.toFixed(2), ms: t.ms, streak: t.streak, ok: t.ok, bad: t.bad_, hits: t.hits, src: t.src, pad: t.padSt, spin: +t.spinT.toFixed(2), camK: +t.camK.toFixed(2), jk: +t.jk.toFixed(2), ay: +t.ay.toFixed(2), ar: +t.ar.toFixed(2), ap: +t.ap.toFixed(2), lock: t.lock })) }),
    camInfo: () => cams.map(c => ({ pos: c.position.toArray().map(v => +v.toFixed(2)), fov: +c.fov.toFixed(1), layers: c.layers.mask })),
    cam(o) { camOverride = o || null; },
    missiles: () => missiles.active,
    ramps: () => ramps.list,
    get fps() { return fps; }, get res() { return AR.info; }, get dashF() { return dashF; },
    renderer, scene, cams, composer, G, T, pmenu, carObj: i => cars[i],
    destroy() {
      if (dead) return; dead = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur); window.removeEventListener("keydown", onEsc);
      try { remote && remote.detach && remote.detach(); } catch (e) { /* */ }
      tools.dispose(); skids.dispose();
      hoods.forEach(h => h.dispose()); cars.forEach(c => c.dispose()); shadows.forEach(s => scene.remove(s)); world.dispose(); missiles.dispose(); ramps.dispose(); trails.dispose();
      composer.dispose(); rt.dispose(); pmrem.dispose(); scene.environment?.dispose();
      renderer.dispose(); renderer.forceContextLoss(); mount.innerHTML = ""; mount.classList.remove("sr-root", "sr2", "sr3", "is-menu", "is-count", "is-race", "is-end");
      if (window.__sr === api) delete window.__sr;
    }
  };
  return api;
}
