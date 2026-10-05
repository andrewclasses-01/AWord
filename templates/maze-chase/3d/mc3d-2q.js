// STAR LOOT — lõi MẪU 2q (05/10/2026): như 2p + iPAD LÀM D-PAD (thầy: "màn 86 inch quá khổng lồ, học sinh đứng sát màn không thấy toàn cảnh…
//   điều khiển bằng iPad (2 iPad trong Fight), iPad chỉ mở D-pad, tín hiệu 1 chiều lên game"; chốt: WebRTC · GIỮ D-pad trên màn dự phòng · cả Single lẫn Fight).
//   • createMazeChase({ …, remote }): `remote` = đường nối iPad (mc3d-padlink-2q.js). Lõi KHÔNG biết mạng — chỉ:
//       remote.attach({ press(team, key), status(team, s) }) ⇒ iPad bấm = y như bấm D-pad trên màn (key u|d|l|r|bomb, hướng THEO MÀN như D-pad);
//       Single: chỉ đội 0 (iPad A) lái · Fight: đội 0 = D-pad trái, đội 1 = D-pad phải. Bấm từ iPad ⇒ nút D-pad trên màn cũng sáng (cả lớp thấy).
//       status(team, "on" | "relay" | "wait" | "") ⇒ nhãn iPad trên D-pad đội đó.
//   • nút Tablet (giữ chỗ từ 1h) nay mở bảng "iPad D-pad": remote.panel(el, { fight }) vẽ mã QR + trạng thái; đóng bảng ⇒ remote.panelClosed().
//     Không có `remote` ⇒ nút như cũ (myGame) / ẩn (AWord).
// ---- ghi chú 2p: STAR LOOT — lõi MẪU 2p (05/10/2026): như 2o + HIỆU NĂNG (thầy: "tiếp tục đo đạc và tối ưu tương tự Train Rush với STAR LOOT").
//   Đo 2o trên TOMKO (Quadro T2000, 3840×2160, DPR 1,25, trong myActivity): màn chờ 52 fps · chơi 44 fps, 18–20 % khung > 33 ms · card 96–100 % ·
//   canvas 3840×1780 (bỏ qua trần `__awMaxPR` = 1) · mỗi câu mới khựng 141–264 ms (vẽ lại sàn trong một khung).
//   Thử: PR 1 + MSAA 4 ⇒ 44 fps (độ nét gần như không ảnh hưởng) · MSAA 0 ⇒ 56–58 fps.
//   • mc3d-autoq-2p.js (chép auto-res-1am của TRAIN RUSH): tự giữ 60 khung — [tối đa + MSAA 4] → [tối đa, MSAA 0] → hạ độ nét; trần `__awMaxPR`; nhớ nấc.
//   • canvas `antialias: false` (mọi thứ vẽ qua composer). Bàn thử `__mc.quality`.
//   • sàn (mc3d-floor-2p.js): sang câu ⇒ vẽ lại sàn CHIA NHIỀU KHUNG (~4 ms/khung) trong lúc câu hỏi to che màn (4,7 s); xong mới đưa lên card.
//     Trước khi dựng mê cung (`buildMaze`) chắc chắn vẽ xong (`finishDeck`). Lúc tải / intro vẫn vẽ ngay như cũ.
// ---- ghi chú 2o: STAR LOOT — lõi MẪU 2o (03/10/2026): chép mc3d-2n.js + ý thầy "Options STAR LOOT không có đủ chức năng (ví dụ chuyển Template)…
//   lấy Rocket Race làm mẫu, tỷ lệ khung hình + size của Rocket Race":
//   • KHUNG mọi mode = khung Rocket Race: rộng hết ô, cao = min(rộng/2, ô − dải nút), dính mép trên (2n: Single cao gần kín màn).
//   • Hàng nút cỡ Rocket Race: nút 44×44 bo 12, cách 10, đồng hồ LED 28px (mc3d-2o.css).
//   • host.options (AWord Đợt 452) ⇒ nút Options mở ĐÚNG bảng Options của AWord trên game (Timer · bộ nghĩa · Lives/Bombs/D-pad… ·
//     nút Template · Apply); game dừng khi bảng mở, chạy tiếp khi đóng. Apply ⇒ AWord gọi api.setOptions(o) — áp như Apply của bảng riêng.
//     Không có host.options (chạy riêng ở myGame) ⇒ bảng Options riêng như 2n.
// ---- ghi chú 2n: STAR LOOT — lõi MẪU 2n (02/10/2026): chép mc3d-2m.js + CHỖ NỐI AWORD (thầy: "đẩy bản đầy đủ lên AWord", Đợt 447). Chạy riêng (myGame) y hệt 2m.
//   • createMazeChase({ …, options, host }): `options` = Options đã lưu của act (khoá OPT_KEYS) · `host` = cầu nối AWord (core/engine.js `ui.host`):
//     listActs() / openAct(id) (nút Thư mục = act thật cùng thư mục) · saveOptions(o) (Apply / Mode lưu theo act) · home() · templates() /
//     switchTemplate(type) (Menu ▸ Change template / Library). Không có host ⇒ danh sách mẫu như 2m.
//   • destroy(): dừng vòng vẽ, gỡ mọi listener window/document, tắt âm (đóng AudioContext), trả card đồ hoạ (dispose + forceContextLoss).
//   • khung đo theo CHÍNH ô mount (không theo cửa sổ) · lớp gốc `.mc-root` thay `#game` · lớp mẫu bảng Options đổi tiền tố `aw-` ⇒ `mco-`
//     (vào AWord thì lớp `aw-` của STAR LOOT không đè bảng Options thật) · nút Tablet ẩn khi có host.
// ---- ghi chú 2m: STAR LOOT — lõi MẪU 2m (01/10/2026): chép mc3d-2l.js, đổi sang mc3d-audio-2m.js + mc3d-intro-2m.js (tiếng tín hiệu tìm thấy/không thấy, nhạc vũ trụ,
//   nhạc kết thúc hùng tráng) · quà bom gọi sfx.gift (trước sfx.win = nhạc thắng).
// ---- ghi chú 2l: STAR LOOT — lõi MẪU 2l (01/10/2026): chép mc3d-2k.js, chỉ đổi sang mc3d-audio-2l.js + mc3d-intro-2l.js (NOT FOUND đỏ + tiếng, ENEMY LOCATED tiếng, nhạc chính bản B).
// ---- ghi chú 2k: STAR LOOT — lõi MẪU 2k (01/10/2026): chép mc3d-2j.js + âm thanh mc3d-audio-2k.js (tiếng thật cho cổng / nắp boong / bay lên, nhạc thua thật,
//   nhạc nền mạnh hơn) + ý thầy: robot vừa chui qua cổng (ra ở cổng bên kia) ⇒ CẢ CẶP CỔNG TẮT 3 s rồi mới hiện lại (gateBackAt) — nhìn là biết
//   đang không chui được. Hồi của robot = 3 s cho khớp.
// ---- ghi chú 2j: STAR LOOT — lõi MẪU 2j (01/10/2026): chép mc3d-2i.js + ý thầy:
//   • Âm thanh mc3d-audio-2j.js (gõ phím chữ HUD, nổ lỗ không gian, còi hú, nhạc vũ trụ du dương, bỏ tiếng tít) · tàu ANDREW bắn nhau có tiếng 1/3 (onFx).
//   • Robot nổ (mình + địch) = tiếng nổ thật (sfx.robotBoom) — bị địch chạm (đỏ) vẫn tiếng giật điện.
//   • Bước chân: mỗi lần MỘT bàn chân chạm boong (đổi dấu nhịp chân) = 1 tiếng bước kim loại khẽ (trước: mỗi 2 ô một tiếng).
//   • Đèn báo động NẰM TRÊN BOONG ngay chân các CỘT mép mê cung (lampPts) — tường/cột dựng lên thì nuốt luôn đèn (sáng tắt dần theo cột).
//   • Nút loa = bảng 2 công tắc EFFECTS / BACKGROUND như Rocket Race.
//   • Options: mở = dừng game; Apply giữa ván ⇒ chỉ còn MỘT nút START AGAIN, bấm là chơi luôn (không intro). Mode đổi được cả giữa ván (vì chơi lại từ đầu).
// ---- ghi chú 2i: STAR LOOT — lõi MẪU 2i (30/9/2026): chép mc3d-2h.js + ÂM THANH THẬT (mc3d-audio-2i.js, file ../am-thanh/*.mp3) thay bộ tiếng tổng hợp:
//   nhạc màn chờ / intro / khi chơi / thắng / thua, còi báo động theo đèn đỏ, tiếng nền boong tàu.
// ---- ghi chú 2h: STAR LOOT — lõi MẪU 2h (30/9/2026): chép mc3d-2g.js + intro mc3d-intro-2h.js · TƯỜNG dựng 3 s trước khi địch trồi (không còn lúc robot quay người)
//   · đèn báo động + viền đỏ nháy ĐỒNG BỘ một nhịp.
// ---- ghi chú 2g: STAR LOOT — lõi MẪU 2g (30/9/2026): chép mc3d-2f.js, chỉ đổi intro sang mc3d-intro-2g.js (hết cú nghiêng 1° lúc ANDREW STUDIO PRESENTS).
// ---- ghi chú 2f: STAR LOOT — lõi MẪU 2f (30/9/2026): chép mc3d-2e.js + intro mc3d-intro-2f.js + cuối intro theo ý thầy: robot chui vào cửa gầm ⇒ ĐÈN BÁO ĐỘNG đỏ
//   nhấp nháy quanh trạm + viền màn đỏ (setAlarm) · robot quay người trên boong ⇒ TƯỜNG DỰNG luôn (raiseWallsIntro) · câu hỏi to đang hiện, 1 s
//   trước khi bay lên mép trên ⇒ ROBOT ĐỊCH trồi lên (spawnEnemies) · câu hỏi bay lên ⇒ tắt báo động, vào đếm 3-2-1.
// ---- ghi chú 2e: STAR LOOT — lõi MẪU 2e (30/9/2026): chép mc3d-2d.js + intro mc3d-intro-2e.js (cổng ra/vào bằng mặt cắt) · bật localClippingEnabled ·
//   tàu mẹ gộp mảnh đứng yên (mc3d-ship-2e.js) ⇒ bớt ~½ lệnh vẽ + rác bộ nhớ (GC) ⇒ màn chờ / intro bay mượt hơn.
// ---- ghi chú 2d: STAR LOOT — lõi MẪU 2d (30/9/2026): chép mc3d-2c.js + ý thầy: robot ĐỨNG/BƯỚC thật trên boong (cổ chân giữ đế phẳng, đế thấp nhất chạm boong,
//   hết nhấp nhô/lún — plantFeet) · đồng hồ LED xuống dãy nút (ngoài cùng trái), menu + loa sát các nút · câu hỏi to giữa màn ⇒ dòng câu hỏi trên
//   ẩn, hết giờ chữ to BAY vào đúng chỗ dòng trên (flyBigq) · bảng OPTIONS kiểu AWord (trắng, 2 cột, thanh chọn, thanh trượt màu, ô tick, Apply)
//   + Timer None/Count up/Count down (hết giờ ⇒ "Time's up") · intro mc3d-intro-2d.js.
// ---- ghi chú 2c: STAR LOOT — lõi MẪU 2c (30/9/2026): chép mc3d-2b.js + intro mc3d-intro-2c.js (góc rộng vũ trụ 2-3, vọt giữ tốc) + hết khựng lúc trao sang câu 1:
//   trên Windows (ANGLE/D3D) shader chỉ THẬT SỰ được dịch ở lần VẼ đầu tiên — compile() không đủ ⇒ warmDrawAll() vẽ thật MỌI vật một lần lúc tải
//   (bật hiện + tắt cắt khung nhìn tạm thời, đèn giữ nguyên trạng thái) · warmRise() vẽ thử cảnh robot trồi qua nắp boong (bóng trong hầm máy).
// ---- ghi chú 2a (2b không ghi đầu file — xem các chú "2b:" trong code): lõi MẪU 2a (30/9/2026): chép mc3d-1z.js + thầy (xem trên TOMKO): chế độ 1 người TRẢI HẾT bề ngang màn rộng (hết 2 dải đen) —
//   khung cao = cửa sổ − dải nút, rộng = cả cửa sổ; chữ/nút tính theo đơn vị --u = min(1cqw, 16/10,5 cqh) (mc3d-2a.css) nên không phình theo bề ngang.
// ---- ghi chú 1z: lõi MẪU 1z (30/9/2026): chép mc3d-1y.js + thầy: cổng CHỈ ÁNH SÁNG, không viền (mc3d-gate-1z.js) · cổng KHÔNG hiện cùng lúc với robot —
//   mở ngẫu nhiên 1,5–6 s sau khi hết đếm 3-2-1 (mỗi câu một lúc khác), có chớp sáng + tiếng; chưa mở thì chưa đi qua được.
// ---- ghi chú 1y: lõi MẪU 1y (30/9/2026): chép mc3d-1x.js + CẶP CỔNG KHÔNG GIAN mọi chế độ (thầy chốt bằng AskUserQuestion + "ok build"):
//   vòng cổng ĐỨNG lõi lỗ giun (mc3d-gate-1y.js) · CHỈ robot mình đi qua (địch coi như ô thường) · qua xong robot đó HỒI 4 s ·
//   đặt mỗi câu (placeGates): cổng "cứu nguy" ở chỗ chật/ngõ cụt khó xoay sở nhất, cổng "lối ra" ở vùng thoáng xa nó; KHÔNG làm tắt tới bệ đúng
//   (đường ngắn nhất có cổng ≥ 70 % không cổng); Fight: 2 đội tới cổng gần mình tương đương + không phá độ công bằng của 1x.
//   Bước vào cổng ⇒ robot bị hút vào xoáy (0,22 s) ⇒ hiện ra ở cổng kia giữ hướng đi ⇒ đi tiếp. Đang hút/nhả không bị địch/bom làm hại.
// ---- ghi chú 1x: lõi MẪU 1x (30/9/2026): chép mc3d-1w.js + ý thầy:
//   (1) Fight: 2 robot xuất phát ở 2 ô XA NHAU nhất có thể, đổi chỗ mỗi câu mới; 2 ô + bệ đúng + bộ góc địch được chọn để QUÃNG ĐƯỜNG và
//       ÁP LỰC ĐỊCH tới bệ đúng của 2 đội tương đương (công bằng) — xem chooseSpawns / pickFightSpots · (2) màn kết quả Fight: tiêu đề
//       ANDREW CLASSES, "X : Y" luôn giữa, mũi tên ĐẶC đứng yên chỉ nhấp nháy sáng · (3) tàu rượt đuổi chậm hơn, lượn một cung mềm (mc3d-ship-1x.js) ·
//   (4) END GAME ⇒ về màn START · (5) bỏ vòng dưới chân robot · (6) thanh giằng pin mặt trời nối liền từ mép mê cung ra suốt cánh pin ·
//   (7) cánh pin xoay nhẹ quanh thanh giằng như đang dò nắng.
// ---- ghi chú 1w: lõi MẪU 1w (30/9/2026): chép mc3d-1v.js + ý thầy (Fight): đồng hồ LED còn 60 % · mê cung to hơn — khoảng D-pad↔mép màn
//   = khoảng D-pad↔mép mê cung · bỏ chữ TEAM A/B trên ô điểm · màn kết quả chỉ "X : Y" + MŨI TÊN sáng chỉ về phía đội thắng · bỏ dải nền tối sau câu hỏi.
// ---- ghi chú 1v: lõi MẪU 1v (29/9/2026): chép mc3d-1u.js + 7 ý thầy về FIGHT:
//   (1) SỬA LỖI robot đội B: cảnh intro thả 2 robot xuống gầm nhưng chỉ 1 chui lên (robot B bị đặt ở ô (0,0), độ nâng không nối vào animRobot) ·
//   (2) số bom = SỐ NHỎ ở giữa quả bom trên nút giữa D-pad · (3) Fight: tim ⇒ VẠCH NĂNG LƯỢNG dọc mảnh sát viền (từ D-pad lên gần mép trên) ·
//   D-pad nhỏ 60 % và dời lên GIỮA màn (hai bên), mê cung co lại chừa chỗ · (4) điểm 2 đội ở 2 GÓC TRÊN, LED 7 thanh neon ·
//   (5) khung game ở Fight = đúng khung Rocket Race Fight: rộng hết màn, cao = min(rộng/2, cửa sổ − dải nút 80 px), dính mép trên ·
//   (6) đồng hồ giữ chỗ cũ, đổi LED 7 thanh neon.
// ---- ghi chú 1u: (29/9/2026): chép mc3d-1t.js + FIGHT 2 ĐỘI (thầy chốt 4 điều bằng AskUserQuestion):
//   (1) CHUNG 1 mê cung, 2 robot đua tới ô đúng — ai chạm ô đúng trước được +1, cả hai sang câu mới · (2) bom làm hại cả hai đội (kể cả bom
//   đối thủ đặt), robot đi xuyên qua nhau · (3) mỗi đội tim + bom riêng, KHÔNG đổi người: mất mạng ⇒ chỉ đội đó nổ/đỏ rồi hồi sinh (hào quang 5 s)
//   tại chỗ, đội kia chơi tiếp; hết tim ⇒ đội đó ra khỏi trận · (4) 2 D-pad Ring hai góc dưới (trái = đội A, phải = đội B), KHÔNG chạm/vuốt;
//   hết câu ⇒ nhiều điểm thắng, hoà thì so số tim. Bật bằng Options ▸ Mode / nút Mode / ?fight=1. Địch đuổi robot gần nhất.
//   Phím: đội A = W A S D + F (bom) · đội B = mũi tên + Enter (bom).
// ---- ghi chú 1t: lõi MẪU 1t (29/9/2026): chép mc3d-1s.js + ý thầy (intro mc3d-intro-1t.js · map mc3d-maps-1t.js):
//   chân robot KHÔNG lún sàn: ngón chân + đế gai nằm trong đáy ủng, robot đứng TRÊN mặt nắp ô xuất phát (cao 0,12) · map bớt khoảng trống ·
//   bệ đáp án đặt theo QUÃNG ĐƯỜNG ĐI THẬT (BFS) trong dải vừa phải (không sát quá, không xa tít) · sân xuất phát hẹp lại (3 ô thay 5).
// ---- ghi chú 1s: lõi MẪU 1s (29/9/2026): chép mc3d-1r.js + ý thầy (intro mc3d-intro-1s.js · tàu mc3d-ship-1s.js · nắp mc3d-hatch-1s.js):
//   Ô TRÒN CỐ ĐỊNH trên boong ở chỗ robot xuất phát (luôn có, đóng nắp) · robot địch phải CHẠM bom (đi sát vào ô bom) mới nổ ·
//   tường màu TRUNG TÍNH (giảm độ rực của mọi bảng màu) · 2 tàu rượt nhau cua mềm hơn, có lúc vòng ra ngoài khung.
// ---- ghi chú 1r: lõi MẪU 1r (29/9/2026): chép mc3d-1q.js + ý thầy (intro mc3d-intro-1r.js):
//   SÀN TRẠM DÀY GẤP 3 (1,2 ⇒ 3,6 — đủ làm căn cứ, robot chui vào bên trong được) · ngón tay (4 ngón + ngón cái, có đốt) và ngón chân
//   (3 ngón trên mũi ủng, đế có gai) chi tiết hơn · câu hỏi đầu hiện NGAY khi máy quay bắt đầu lùi khỏi robot (intro trao cho game rồi
//   vẫn lái máy quay tới hết đoạn lùi — `intro.tailing`), robot giữ hướng nhìn ra máy quay · ctx.deckBottom, ctx.teammate.cell().
// ---- ghi chú 1q: lõi MẪU 1q (29/9/2026): chép mc3d-1p.js + ý thầy chỉnh intro (mc3d-intro-1q.js):
//   màn START chỉ còn tên STAR LOOT + nút START · bỏ vệt sáng siêu tốc toàn màn — tàu bay chậm, hiện CẢNH BÁO (ENEMY LOCATED ·
//   POSITION: tên act · TARGET: số từ) ⇒ tàu lao đi, máy quay về sau lưng tàu, xuyên vài LỖ GIUN (chói loà, sang vùng khác) ⇒ tới nơi
//   góc rộng, bụng tàu mở, robot nhảy ra, bụng đóng ⇒ robot bay xuống gầm ⇒ sát boong: robot trồi lên QUAY LƯNG (thấy ANDREW TEAM
//   trên ba lô — đổi từ ANDREW CLASSES) rồi quay mặt lại ⇒ lùi về góc chơi. Tham số mới `act` (tên act hiện ở dòng POSITION).
// ---- ghi chú 1p: lõi MẪU 1p (29/9/2026): chép mc3d-1o.js + thầy chọn intro A và đổi CỐT TRUYỆN + TÊN GAME "STAR LOOT":
//   màn START = thiên hà bao la (hạm đội ANDREW CLASSES đậu, chưa chạy gì) · bấm START ⇒ intro cốt truyện (mc3d-intro-1p.js): ANDREW
//   STUDIO PRESENTS, nhảy siêu tốc qua nhiều thiên hà, tới căn cứ địch, robot nhảy khỏi tàu bay bằng phản lực ba lô, luồn xuống dưới
//   mê cung, trồi lên qua nắp ở ô xuất phát ⇒ máy quay lùi về góc chơi ⇒ câu hỏi đầu (cùng map, robot đứng sẵn — không dựng lại).
//   Bầu trời đổi màu theo thiên hà (uniform uB0/uB1/uN1/uN2/uBand của SKY_SHADER). ?robots=2 xem thử cảnh thả 2 robot (Fight).
// ---- ghi chú 1o: (29/9/2026): chép mc3d-1n.js + INTRO ĐIỆN ẢNH như Rocket Race (thầy: "làm vài bản để tôi chọn"):
//   bấm START ⇒ phase "cine" chạy intro (mc3d-intro-1o.js) ngay trong cảnh game ⇒ kết thúc đúng góc máy game ⇒ câu hỏi đầu. Bấm ĐÚP
//   để bỏ qua. 3 bản: A hạm đội đến · B thả robot · C báo động đỏ (chọn bằng tham số `intro` hoặc ?intro=a|b|c). "Start again" không
//   chạy lại intro (chỉ nút START ở màn chờ).
// ---- ghi chú 1n: (29/9/2026): chép mc3d-1m.js + ý thầy: đếm tới 1 thì vòng đếm BUNG TAN ra 4 phía · tàu ANDREW có SÚNG
//   HÔNG thật (xoay nòng ngắm tàu con, đạn bắn ra từ đầu nòng, giật nòng) (mc3d-ship-1n.js) · tường thật hơn: vết bẩn loang, bẩn chân
//   tường, vệt chảy, bụi trên mặt, đường ghép tấm (shader theo toạ độ thế giới ⇒ mỗi đoạn tường một kiểu).
// ---- ghi chú 1m: (29/9/2026): chép mc3d-1l.js + ý thầy: đếm CHỈ 3-2-1 rồi vào chơi luôn, BỎ chữ GO (mọi chỗ) · mỗi câu MỚI:
//   câu hỏi to hiện thêm 3 s rồi đếm 3-2-1; vẫn câu đó (mất mạng, đổi người) ⇒ chỉ đếm 3-2-1 · game over: bỏ vòng xoay, "2 / 9" một hàng ·
//   menu: bỏ "Back to start screen", thêm END GAME cuối · ô sai: không nảy, nổ là robot tan đốm sáng ngay tại chỗ · Show answers khung
//   to tối đa, hiện cả đáp án SAI đã chọn lẫn đáp án ĐÚNG · bỏ ô % ⇒ thanh tiến độ mảnh dài bằng khung game · tàu con luôn bị BẮN nổ ở
//   chỗ nhìn thấy (mc3d-ship-1m.js).
// ---- ghi chú 1l: (29/9/2026): chép mc3d-1k.js + ý thầy: hào quang bảo vệ 3 ⇒ 5 s · đồng hồ, bom, tim, điểm xuống MÉP DƯỚI
//   trong màn chơi (thầy chọn), hàng trên CHỈ còn câu hỏi, bỏ dấu tích cạnh điểm · màn kết thúc kiểu vũ trụ (vòng HUD quanh điểm) · ô sai:
//   đom đóm bung ra từ CHÍNH thân robot · tàu rượt đuổi vòng vòng, nghiêng theo khúc cua, laser mảnh, chữ hết bị che, tàu con vỡ vụn
//   tối rơi dần + bốc khói (mc3d-ship-1l.js · mc3d-boom-1l.js).
// ---- ghi chú 1k: (29/9/2026): chép mc3d-1j.js + ý thầy: mọi chỗ đếm 3 s ⇒ 5 s (đầu ván 5-4-3-2-1-GO!, đổi người 5-4-3-2-1-GO!),
//   số đếm + chữ GO kiểu HUD tàu vũ trụ (vòng vạch xoay + cung vàng chạy theo giây, GO! vàng bung vòng) · lửa đuôi tàu nhấp nhô thật hơn ·
//   tàu con nổ ra bộ mảnh xác kiểu Rocket Race (mc3d-ship-1k.js) · đồng hồ, câu hỏi, bom, tim, điểm KHÔNG còn ô chứa: chữ/số nổi phát sáng.
// ---- ghi chú 1j: (29/9/2026): chép mc3d-1i.js + ý thầy: robot mình nổ ⇒ ĐỐM SÁNG như đom đóm bung ra rồi bay lên tắt (không
//   còn xác) · vệt cháy mỗi vụ một kiểu, khói bốc một lát rồi tắt · nắp boong TRÒN kiểu ống kính, nhìn xuống thấy HẦM MÁY (máy móc, robot
//   tuần tra, mờ xa) · tàu ANDREW CLASSES nhỏ 2/3, săn tàu con (3 kiểu), bắn laser 2 bên, tàu con nổ ở chỗ nhìn thấy; vào từ nhiều hướng ·
//   lửa động cơ shader · tàu chi tiết hơn · sao nhiều tầng, nhỏ hơn, lấp lánh (mc3d-hatch-1j.js · mc3d-ship-1j.js · mc3d-boom-1j.js).
// ---- ghi chú 1i: (29/9/2026): chép mc3d-1h.js + ý thầy: ô sai ⇒ nổ TRƯỚC, robot bị hất lên và VỠ TỪ CHÍNH HÌNH DẠNG của
//   nó ngay khi vừa bay lên (mảnh nhỏ, thật) · NẮP BOONG (mc3d-hatch-1i.js): mọi lần robot (mình + địch) xuất hiện / rời đi đều qua nắp sàn
//   mở ra – nâng/hạ – đóng lại · vòng nét đứt chỗ xuất phát XOAY · đúng ô: địch nổ tung thành xác cháy tại chỗ, mình đứng chào, tường ẩn,
//   rồi hạ xuống qua nắp boong · sao + tinh vân xoay tròn rất chậm, lệch nhau (3D) · tàu vũ trụ kiểu Star Destroyer bay qua xa xa
//   ~45–60 s/lần, lửa khói đẩy, slogan ANDREW CLASSES sáng đèn chập chờn (mc3d-ship-1i.js).
// ---- ghi chú 1h: (29/9/2026): chép mc3d-1g.js + ý thầy: nút TABLET (nối iPad, như Rocket Race; chức năng gán sau) thay "table" ·
//   ô % tiến độ ở hàng nút · đồng hồ + cụm điểm góc trên thiết kế lại cùng kiểu · BOM có thanh giờ 5 s trên đầu, hết giờ tự nổ, robot chạm
//   trước thì nổ ngay; nổ PHÁ vách sát ô bom (giữ tường bao ngoài) · đúng ⇒ quay mặt ra khán giả, TAY CHÀO kiểu quân đội · khắc
//   ANDREW CLASSES trên ba lô · bị địch đụng ⇒ KHÔNG teo nhỏ, đổi màu ĐỎ · vào ô sai ⇒ nổ như dính bom, bệ vỡ, robot nảy lên vỡ tung,
//   3-2-1 rồi robot mới hiện ĐÚNG chỗ đó, giữ hướng mặt, còn vệt cháy · robot mới có HÀO QUANG bảo vệ 3 s.
// ---- ghi chú 1g: (29/9/2026): chép mc3d-1f.js + 6 ý thầy: màn đổi người CHỈ còn số đếm (bỏ NEXT PLAYER) ·
//   icon bom nằm CHÍNH GIỮA nút · robot mình bớt chói (bộ đồ xám nhạt, bớt phản sáng, đèn dịu) · nút hàng dưới CHỈ icon ·
//   bỏ nút Full screen · thêm nút hệ AWord: mở thư mục (chuyển act) · Options · Table (bảng xếp hạng) · Mode.
// ---- ghi chú 1f: (29/9/2026): chép mc3d-1e.js + 4 ý thầy: nút giữa D-pad CHỈ icon bom (không số), icon gọn/hiện đại ·
//   D-pad Ring vẽ bằng SVG sắc nét (bỏ kính mờ + vạch chéo đè lên phím) · ANDREW STUDIO nhỏ + tối, chỉ khắc chìm, mở vách phía trước
//   để thấy đủ 2 dòng · xác robot = đúng bộ phận robot (mc3d-boom-1f.js).
// ---- ghi chú 1e: (29/9/2026): chép mc3d-1d.js + 4 ý thầy:
//   (1) ĐỔI NGƯỜI sau mỗi mạng mất (bị bắt / vào ô sai / dính bom): mỗi HS chơi 1 mạng ⇒ màn NEXT PLAYER đếm 3 giây, robot BAY VỀ
//       góc xuất phát, phi hành gia về giữa, HS mới nhận lại số bom đầu lượt · (2) sân xuất phát mở rộng 3×3 có chữ ANDREW STUDIO khắc
//       trên boong (mc3d-floor-1e.js) · (3) BOM đặt bằng nút giữa D-pad (hoặc Space/B): bom thành VẬT CẢN, robot đuổi tới sát bom ⇒ NỔ;
//       robot trong tầm vỡ tung thành xác cháy đen bốc khói nằm lại (mc3d-boom.js), không quay lại ở câu đó; người đứng sát cũng mất mạng;
//       bom nổ lan sang bom khác trong tầm · Options Bombs 0–10 (mỗi HS) + Bomb gift (cứ K câu đúng +1) · (4) nút chức năng ra NGOÀI
//       màn chơi (thanh dưới, kiểu Rocket Race).
// ---- ghi chú 1d: thầy chọn D-pad B (Ring = mặc định) + "làm sàn đẹp và chi tiết hơn,
//   sàn hiện tại trông giả quá" ⇒ sàn tàu vũ trụ PBR vẽ bằng mc3d-floor.js (màu + gồ ghề + độ bóng + đèn), vẽ lại mỗi câu.
// ---- ghi chú của 1c:
//   (1) 5 KIỂU D-PAD để chọn (Options ▸ D-pad style, hoặc ?dpad=glass|ring|keys|console|stick) ·
//   (2) chữ đáp án = BẢNG HOLOGRAM chiếu từ bệ lên, đáy bảng CAO HƠN đầu phi hành gia (hết cảnh người lẫn vào chữ);
//       tới bệ đúng: bảng lật ✓ + người nhảy mừng + tia sáng đưa người đi; bệ sai: bảng đỏ rung + người BỊ BẬT LÙI 1 ô ·
//   (3) sàn liền một mặt (bỏ chia ô), mép sàn có vách dày · (4) 10 MAP (mc3d-maps.js): hình trạm + kiểu mê cung + màu, mỗi câu một map.
// ---- ghi chú của 1b:
//   màu rõ ràng (sàn sáng · tường 1 họ xanh đậm · bệ vàng · địch đỏ/tím · người trắng-xanh) · phi hành gia + robot địch chi tiết hơn ·
//   chậm hơn nhiều (người 3 ô/s thay 5) · sáng hơn tổng thể. Mẫu 1/2/3 vẫn dùng mc3d.js (không đổi).
// Luật chép từ AWord `templates/maze-chase/maze-chase.js` (bản 2D đang LIVE) để sau này ghép vào AWord không lệch:
//   mê cung DFS + braid sinh MỖI câu · bệ đúng +1 điểm & sang câu · bệ sai ✗ mất tim + bệ bị loại ·
//   địch chạm ⇒ mất tim, văng về xuất phát, địch về góc xa, ân hạn 1,9 s · địch BFS đuổi + 22% ngẫu nhiên ·
//   Difficulty 1–10 ⇒ số địch (≤3→1, ≤6→2, ≤8→3, còn lại 4) + tốc độ địch (max(230, 400 − diff·14) ms/ô).
// Điều khiển (thầy chốt 29/9): phím mũi tên/WASD · D-pad sát mép màn · chạm/vuốt về PHÍA muốn đi so với nhân vật.
// Mọi hướng nhập vào là hướng TRÊN MÀN HÌNH; đổi sang hướng mê cung bằng cách chiếu 4 hướng quanh nhân vật lên màn
// ⇒ cùng một cách cho cả 3 góc máy (kể cả máy quay sau lưng xoay theo nhân vật).
// createMazeChase({ mount, view: "tilt" | "chase" | "top", questions, title })
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { EffectComposer } from "../../rocket-race/vendor/three/addons/EffectComposer.js";
import { RenderPass } from "../../rocket-race/vendor/three/addons/RenderPass.js";
import { UnrealBloomPass } from "../../rocket-race/vendor/three/addons/UnrealBloomPass.js";
import { ShaderPass } from "../../rocket-race/vendor/three/addons/ShaderPass.js";
import { OutputPass } from "../../rocket-race/vendor/three/addons/OutputPass.js";
import { RoomEnvironment } from "../../rocket-race/vendor/three/addons/RoomEnvironment.js";
import { createMcSound } from "./mc3d-audio-2n.js";   /* 2n: + close() */   /* 2m */   /* 2j: + gõ phím chữ HUD, nổ thật, còi hú, nhạc vũ trụ du dương (2i: file thu âm thật) */
import { createIntro } from "./mc3d-intro-2m.js";   /* 2m */
import { MAPS, genMap, makeDeck } from "./mc3d-maps-1t.js";
import { createDeckPainter } from "./mc3d-floor-2p.js";   /* 2p: + paintLazy */
import { makeAutoQuality } from "./mc3d-autoq-2p.js";   /* 2p */
import { createBoomFX, makeBomb } from "./mc3d-boom-1v.js";
import { MeshSurfaceSampler } from "../../rocket-race/vendor/three/addons/MeshSurfaceSampler.js";
import { createHatches, createPortal, createUnderdeck, UNDER } from "./mc3d-hatch-1s.js";
import { createFleet } from "./mc3d-ship-2j.js";
import { createGates } from "./mc3d-gate-2b.js";

const FONT = '"Baloo 2", system-ui, sans-serif';
const ASPECT = 16 / 10.5;                        // đúng khung act đơn của AWord
const COLS = 15, ROWS = 7, CELL = 4;             // lưới như bản 2D
const W = COLS * CELL, D = ROWS * CELL;
const WALL_T = 0.72, WALL_H = 1.6;
const PLAYER_SPEED = 3;                          // ô/giây (thầy 29/9: "quá nhanh, giảm khá nhiều"; mẫu 1 là 5, bản 2D 6,25)
const SPEED_SCALE = PLAYER_SPEED / 6.25;         // địch giữ đúng tỉ lệ tốc độ với người như bản 2D
const GRACE = 1.9, INVULN = 1.4, HOLD = 1.7, EJECT = 0.5;   // 1h: HOLD 0.9 → 1.7 cho kịp đứng chào
const FUSE_S = 5, SHIELD_S = 5;                             // 1l: hào quang 3 ⇒ 5 s ·                             // 1h: bom tự nổ sau 5 s · hào quang bảo vệ 3 s khi robot mới xuất hiện

const DIRS = {
  u: { dr: -1, dc: 0, opp: "d" }, d: { dr: 1, dc: 0, opp: "u" },
  l: { dr: 0, dc: -1, opp: "r" }, r: { dr: 0, dc: 1, opp: "l" },
};
const DK = ["u", "d", "l", "r"];
// 1h: tư thế chào (tay phải = arms[0], vì người quay mặt ra máy quay): vai x/z/y + khuỷu x/z (rad) — chỉnh bằng __mc.astro
const SALUTE = { sx: -2.05, sz: -0.55, sy: 0.35, ex: -1.9, ez: 0.9 };
const ENEMY_SPOTS = [[0, 0], [ROWS - 1, COLS - 1], [0, COLS - 1], [ROWS - 1, 0]];
const SCREEN_VEC = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };

const VIEWS = {
  tilt:  { label: "Chéo từ trên cao", kind: "fixed", dir: [0, 1.5, 1], fov: 32, labelY: 5.0, labelW: 1.8 },
  chase: { label: "Bám sau lưng", kind: "chase", overview: [0, 1.5, 1], fov: 52, back: 11, height: 11.5, ahead: 7, labelY: 4.6, labelW: 2.1, minimap: true },
  top:   { label: "Thẳng từ trên xuống", kind: "fixed", dir: [0, 1, 0.1], fov: 30, labelY: 1.3, labelW: 2.0 },
};
const DEFAULTS = { lives: 5, difficulty: 6, dpad: "r", dpadStyle: "ring", shuffle: true, bombs: 1, bombGift: 3, fight: false, timer: "up", timerSec: 120, showAnswers: true };   // 2d: + timer, showAnswers (như AWord)
const SWAP_S = 3;                          // 1e: giây chờ đổi học sinh · 1k: 3 ⇒ 5 s · 1m: thầy đổi lại 3-2-1
const BLAST_R = 1.8 * 4, NEAR_R = 1.15 * 4; // tầm nổ hạ robot ĐỊCH · tầm làm robot MÌNH mất mạng (đơn vị thế giới; ô = 4) — 2b: địch 1,6 ⇒ 1,8 ô, mình 1,25 ⇒ 1,15 ô
// 2b: robot MÌNH còn được TƯỜNG che: bên kia vách (vách lúc CHƯA nổ) thì không sao; robot địch thì vẫn chết xuyên vách
const BAR_H = 80;                          // thanh nút ngoài màn chơi (như Rocket Race)   // 1d: thầy chọn B · Ring
const DPAD_STYLES = ["glass", "ring", "keys", "console", "stick"];
const DPAD_STYLE_NAMES = { glass: "A · Glass", ring: "B · Ring", keys: "C · Keys", console: "D · Console", stick: "E · Stick" };
const DPAD_MODES = ["r", "l", "both", "off"];
const DPAD_NAMES = { r: "Right", l: "Left", both: "Both", off: "Off" };
const TEAM_META = [{ name: "TEAM A", hex: 0x38bdf8, sh: [0.49, 0.83, 0.99] }, { name: "TEAM B", hex: 0xfb923c, sh: [0.99, 0.62, 0.30] }];   // 1u: màu đội

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = x => x * x * (3 - 2 * x);
const easeOutBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const randi = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = randi(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const key = (r, c) => r + "," + c;
const cellX = c => (c - (COLS - 1) / 2) * CELL;
const cellZ = r => (r - (ROWS - 1) / 2) * CELL;
const fmt = s => { s = Math.floor(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

// ------------------------------------------------------------------ luật mê cung (chép bản 2D)
function genMaze() {
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ u: false, d: false, l: false, r: false, seen: false })));
  const inb = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const stack = [[randi(ROWS), randi(COLS)]];
  grid[stack[0][0]][stack[0][1]].seen = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const opts = DK.filter(k => { const nr = r + DIRS[k].dr, nc = c + DIRS[k].dc; return inb(nr, nc) && !grid[nr][nc].seen; });
    if (!opts.length) { stack.pop(); continue; }
    const k = opts[randi(opts.length)], nr = r + DIRS[k].dr, nc = c + DIRS[k].dc;
    grid[r][c][k] = true; grid[nr][nc][DIRS[k].opp] = true; grid[nr][nc].seen = true;
    stack.push([nr, nc]);
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {       // braid: mở thêm 1 tường ở mọi ngõ cụt
    const cl = grid[r][c];
    if (DK.filter(k => cl[k]).length > 1) continue;
    const cand = shuffle(["l", "r", "u", "d"].filter(k => inb(r + DIRS[k].dr, c + DIRS[k].dc) && !cl[k]));
    if (cand.length) { const k = cand[0]; cl[k] = true; grid[r + DIRS[k].dr][c + DIRS[k].dc][DIRS[k].opp] = true; }
  }
  return grid;
}
function bfsStep(grid, sr, sc, tr, tc) {
  if (sr === tr && sc === tc) return null;
  const prev = new Map(), seen = new Set([key(sr, sc)]), q = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const k of DK) {
      if (!grid[r][c][k]) continue;
      const nr = r + DIRS[k].dr, nc = c + DIRS[k].dc, kk = key(nr, nc);
      if (seen.has(kk)) continue;
      seen.add(kk); prev.set(kk, key(r, c));
      if (nr === tr && nc === tc) {
        let cur = kk, parent = prev.get(cur);
        while (parent !== key(sr, sc)) { cur = parent; parent = prev.get(cur); }
        const [fr, fc] = cur.split(",").map(Number);
        return DK.find(d => sr + DIRS[d].dr === fr && sc + DIRS[d].dc === fc) || null;
      }
      q.push([nr, nc]);
    }
  }
  return null;
}
// 1t: khoảng cách = số bước ĐI THẬT trong mê cung (BFS) — bệ nằm trong dải vừa phải: không sát (≥ 35% quãng xa nhất, tối thiểu 5 bước),
//   không xa tít (≤ 80%). Thiếu chỗ thì nới dải dần.
function pathDist(grid, sr, sc) {
  const dist = grid.map(row => row.map(() => -1)); dist[sr][sc] = 0; const q = [[sr, sc]];
  const D4 = { u: [-1, 0], d: [1, 0], l: [0, -1], r: [0, 1] };
  while (q.length) { const [r, c] = q.shift(); for (const k in D4) if (grid[r][c][k]) { const nr = r + D4[k][0], nc = c + D4[k][1]; if (dist[nr][nc] < 0) { dist[nr][nc] = dist[r][c] + 1; q.push([nr, nc]); } } }
  return dist;
}
function pickSpots(n, sr, sc, grid, espots) {
  const dist = pathDist(grid, sr, sc); let maxD = 1;
  dist.forEach(row => row.forEach(v => { if (v > maxD) maxD = v; }));
  for (const [lo0, hi0] of [[0.35, 0.8], [0.25, 0.9], [0, 1]]) {
    const lo = Math.max(lo0 ? 5 : 3, Math.round(maxD * lo0)), hi = Math.max(lo + 2, Math.round(maxD * hi0));
    const got = pickSpotsIn(n, sr, sc, grid, espots, dist, lo, hi);
    if (got.length >= n) return got;
  }
  return pickSpotsIn(n, sr, sc, grid, espots, dist, 1, 999);
}
function pickSpotsIn(n, sr, sc, grid, espots, dist, lo, hi) {
  const all = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!grid[r][c].on || grid[r][c].plaza) continue;              // 1c: map có ô trống (không sàn) · 1e: sân xuất phát
    const d = dist[r][c]; if (d < lo || d > hi) continue;
    // khác bản 2D: không đặt bệ sát góc địch xuất phát (địch về góc sau mỗi lần bắt ⇒ bệ cạnh góc bị "canh" mãi)
    const nearEnemy = espots.some(([er, ec]) => Math.abs(r - er) + Math.abs(c - ec) < 3);
    if (!nearEnemy) all.push([r, c, d]);
  }
  shuffle(all);
  const chosen = [];
  for (const s of all) { if (chosen.length >= n) break; if (chosen.every(k => Math.abs(k[0] - s[0]) + Math.abs(k[1] - s[1]) >= 4)) chosen.push(s); }
  for (const s of all) { if (chosen.length >= n) break; if (!chosen.includes(s) && chosen.every(k => Math.abs(k[0] - s[0]) + Math.abs(k[1] - s[1]) >= 2)) chosen.push(s); }
  for (const s of all) { if (chosen.length >= n) break; if (!chosen.includes(s)) chosen.push(s); }
  return chosen.map(s => [s[0], s[1]]);
}

// ------------------------------------------------------------------ HUD
const IC = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/><path class="x" d="m16 9 6 6m0-6-6 6"/></svg>',
  // 1g: bộ icon chép từ AWord core/icons.js (actSwitch · options · trophy · single) cho giống hệ thống
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  options: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h13M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/></svg>',
  // 1h: TABLET (thầy: "table" là gõ nhầm) — icon máy tính bảng như nút iPad của Rocket Race
  tablet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2.2"/><path d="M12 18h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pct: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  mode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1.8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.3"/><path d="m7.6 12.4 3 3 5.9-6.3"/></svg>',
  fight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.1" y="6" width="7.5" height="12" rx="1.6"/><rect x="14.4" y="6" width="7.5" height="12" rx="1.6"/><path d="M12 6.5v11"/></svg>',
};
// 1f: icon bom gọn, cân đối — thân tròn + chóp + ngòi ngắn + tia lửa, có vệt bóng
// 1g: thân bom tròn nằm ĐÚNG TÂM (12,12) ⇒ icon ở chính giữa nút; chóp + ngòi + tia lửa nhỏ, chếch 45° lên phải
const BOMB_SVG = '<svg viewBox="0 0 24 24" class="bomb-ic"><circle cx="12" cy="12" r="7.6" fill="currentColor"/><path d="M17.3 6.7l1.3-1.3" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M19.2 4.8c.4-.7 1.1-1 1.8-.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="21.6" cy="3.2" r="1.2" fill="#fbbf24"/><path d="M7.8 9.9a4.6 4.6 0 0 1 3.1-2.9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.7" stroke-linecap="round"/></svg>';
// 1k: tim vẽ SVG (mất mạng = chỉ còn viền) thay ký tự ♥
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.6s-7.4-4.5-9.4-9.1C1.1 8.1 3.1 4.4 6.8 4.4c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.7 0 5.7 3.7 4.2 7.1-2 4.6-9.4 9.1-9.4 9.1z"/></svg>';
// 1k: ĐẾM NGƯỢC kiểu HUD: vòng vạch xoay + cung vàng chạy hết theo từng giây + 4 ngoặc xoay ngược; GO! vàng, vòng bung ra
// 1n: + 4 MẢNH CUNG (trên · phải · dưới · trái), bình thường ẩn; tới số 1 vòng tắt, 4 mảnh bung ra 4 phía rồi tan
const cdArc = (r, a0, a1) => { const P = a => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)].map(v => v.toFixed(2)).join(" "); return `M ${P(a0)} A ${r} ${r} 0 0 1 ${P(a1)}`; };
const CD_SHARDS = [["u", -90], ["r", 0], ["d", 90], ["l", 180]].map(([k, a]) =>
  `<g class="cd-shard" data-d="${k}"><path class="s-tick" d="${cdArc(92, a - 42, a + 42)}"/><path class="s-arc" d="${cdArc(78, a - 40, a + 40)}"/><path class="s-brk" d="${cdArc(64, a - 22, a + 22)}"/></g>`).join("");
const COUNT_HTML = `<svg class="cd-ring" viewBox="-100 -100 200 200"><g class="cd-whole"><circle class="cd-glow" r="70"/><circle class="cd-tick" r="92"/><circle class="cd-track" r="78"/><circle class="cd-arc" r="78"/><circle class="cd-brk" r="64"/></g>${CD_SHARDS}</svg><b class="cd-n"></b>`;
// 1f: D-pad Ring bằng SVG — 4 múi vành khăn tách nhau, mũi tên tam giác sắc nét; không kính mờ, không vạch đè
function ringSVG() {
  const P = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)].map(v => v.toFixed(2)).join(" ");
  const RO = 97, RI = 38, H = 41;                    // bán kính ngoài / trong, nửa góc mỗi múi (khe 8°)
  const sector = a => `M ${P(RO, a - H)} A ${RO} ${RO} 0 0 1 ${P(RO, a + H)} L ${P(RI, a + H)} A ${RI} ${RI} 0 0 0 ${P(RI, a - H)} Z`;
  const arrow = a => `M ${P(82, a)} L ${P(60, a - 13)} L ${P(60, a + 13)} Z`;
  const D = { u: -90, r: 0, d: 90, l: 180 };
  return `<svg class="ring" viewBox="-100 -100 200 200">${Object.entries(D).map(([k, a]) => `<g class="w" data-d="${k}"><path class="s" d="${sector(a)}"/><path class="a" d="${arrow(a)}"/></g>`).join("")}</svg>`;
}
const DPAD = `<i class="base"></i><i class="knob"></i>${ringSVG()}<button class="u" data-d="u">▲</button><button class="l" data-d="l">◀</button><button class="hub" data-bomb="1" title="Bomb">${BOMB_SVG}<b class="hub-n">1</b></button><button class="r" data-d="r">▶</button><button class="d" data-d="d">▼</button>`;
const HUD_HTML = `
<div class="mc-stage">
  <canvas class="mc-gl"></canvas>
  <div class="mc-top" hidden><div class="mc-q"><span></span></div>
    <div class="mc-bot"><div class="mc-clock">${IC.clock}<b>0:00</b></div><div class="mc-bombs">${BOMB_SVG}<b>1</b></div><div class="mc-lives"></div><div class="mc-score"><b>0</b></div></div></div>
  <canvas class="mc-mini" hidden></canvas>
  <div class="mc-alarm"></div>
  <div class="mc-bigq" hidden><b class="mc-mapname"></b><span></span></div>
  <div class="mc-swap" hidden></div>
  <div class="mc-count" hidden>${COUNT_HTML}</div>
  <div class="mc-fteam is-a" hidden></div><div class="mc-fteam is-b" hidden></div><div class="mc-fbar is-a" hidden></div><div class="mc-fbar is-b" hidden></div>
  <div class="mc-dpad is-l" hidden>${DPAD}</div>
  <div class="mc-dpad is-r" hidden>${DPAD}</div>
  <div class="mc-padtag is-l" hidden>${IC.tablet}<b></b></div><div class="mc-padtag is-r" hidden>${IC.tablet}<b></b></div>
  <div class="mc-ov mc-ov-start"><div class="mc-card">
    <div class="mc-kicker"></div><h1>STAR LOOT</h1><p class="mc-sub"></p>
    <p class="mc-how">Grab the right word from the enemy base — avoid the enemy robots!</p>
    <button class="mc-big mc-go">START</button>
    <div class="mc-opts" hidden></div>
  </div></div>
  <div class="mc-ov mc-ov-again" hidden><button class="mc-big mc-again2">START AGAIN</button></div>
  <div class="mc-ov mc-ov-pause" hidden><div class="mc-card"><h2>Paused</h2>
    <button class="mc-big mc-resume">Resume</button><button class="mc-mid mc-restart">Start again</button><button class="mc-mid mc-endgame">END GAME</button>
    <div class="mc-hostrow" hidden><button class="mc-link mc-chtpl">Change template</button><button class="mc-link mc-lib">Library</button></div></div></div>
  <div class="mc-ov mc-ov-end" hidden><div class="mc-card">
    <div class="mc-kicker mc-end-title"></div>
    <div class="mc-end-score"><b class="es-n">0</b><i class="es-of">/ 0</i></div>
    <p class="mc-sub mc-end-sub"></p>
    <button class="mc-big mc-again">Start again</button><button class="mc-link mc-showans">Show answers</button>
    <div class="mc-ans" hidden></div>
  </div></div>
</div>
<div class="mc-prog" title="Progress"><i></i></div>
<div class="mc-outbar">
  <button class="mc-tool mc-menu" title="Menu" aria-label="Menu">${IC.menu}</button>
  <button class="mc-tool mc-sound" title="Sound" aria-label="Sound">${IC.sound}</button>
  <i class="mc-tool-gap"></i>
  <button class="mc-tool mc-folder" title="Switch activity" aria-label="Switch activity">${IC.folder}</button>
  <button class="mc-tool mc-options" title="Options" aria-label="Options">${IC.options}</button>
  <button class="mc-tool mc-tablet" title="Tablet" aria-label="Tablet">${IC.tablet}</button>
  <button class="mc-tool mc-mode" title="Mode" aria-label="Mode">${IC.mode}</button>
</div>
<div class="mc-ov mc-ov-panel" hidden><div class="mc-card mc-pn">
  <button class="mc-pn-x" aria-label="Close">✕</button>
  <h2 class="mc-pn-t"></h2><div class="mc-pn-b"></div>
</div></div>`;

// ------------------------------------------------------------------ vật liệu vẽ bằng canvas
function canvasTex(w, h, draw, srgb = true) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// 1c: sàn LIỀN một mặt theo hình map (thầy: "sàn chia ngăn thành các ô trông rất rối mắt") — không kẻ ô;
// chỉ có vân kim loại mờ + tối dần sát mép trống. Ô không có sàn = trong suốt (alphaTest) ⇒ thấy vũ trụ bên dưới.
const FLOOR_P = 96;
let _noise = null;
function floorNoise() {
  if (_noise) return _noise;
  const n = document.createElement("canvas"); n.width = 60; n.height = 28;
  const g = n.getContext("2d");
  for (let y = 0; y < 28; y++) for (let x = 0; x < 60; x++) { const v = 118 + Math.random() * 20; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); }
  return (_noise = n);
}
function paintFloor(cv, grid, theme) {
  const P = FLOOR_P, w = COLS * P, h = ROWS * P;
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d"); g.clearRect(0, 0, w, h);
  const on = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].on;
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, theme.floor[0]); gr.addColorStop(1, theme.floor[1]);
  g.fillStyle = gr;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (on(r, c)) g.fillRect(c * P - 0.5, r * P - 0.5, P + 1, P + 1);
  g.save(); g.globalCompositeOperation = "source-atop";
  g.globalAlpha = 0.16; g.filter = "blur(6px)"; g.drawImage(floorNoise(), 0, 0, w, h); g.filter = "none";
  g.globalAlpha = 0.05; g.fillStyle = "#fff";
  for (let y = 0; y < h; y += 5) if (Math.random() < 0.5) g.fillRect(0, y, w, 1);           // vân chải kim loại, rất mờ
  g.globalAlpha = 1;
  const edge = (x, y, dx, dy, len, horiz) => {           // tối dần sát mép sàn
    const sh = horiz ? g.createLinearGradient(x, y, x, y + dy) : g.createLinearGradient(x, y, x + dx, y);
    sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sh;
    if (horiz) g.fillRect(x, Math.min(y, y + dy), len, Math.abs(dy)); else g.fillRect(Math.min(x, x + dx), y, Math.abs(dx), len);
  };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!on(r, c)) continue;
    const x = c * P, y = r * P;
    if (!on(r - 1, c)) edge(x, y, 0, 26, P, true);
    if (!on(r + 1, c)) edge(x, y + P, 0, -26, P, true);
    if (!on(r, c - 1)) edge(x, y, 26, 0, P, false);
    if (!on(r, c + 1)) edge(x + P, y, -26, 0, P, false);
  }
  g.restore();
}
function solarTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = "#0a1330"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      const gr = g.createLinearGradient(x, y, x + 32, y + 32); gr.addColorStop(0, "#1c3b8a"); gr.addColorStop(1, "#10245e");
      g.fillStyle = gr; g.fillRect(x + 2, y + 2, 28, 28);
    }
    g.fillStyle = "#c0c8d8"; g.fillRect(0, h / 2 - 3, w, 6);
  });
}
function planetTex() {
  return canvasTex(1024, 512, (g, w, h) => {
    const bands = ["#3b1d6e", "#5a2a8c", "#7a3fa8", "#4b2a7c", "#9a5ab8", "#5d2f86", "#3a1f5c", "#6f3a9a"];
    for (let y = 0; y < h; y++) {
      const t = y / h, i = Math.floor((t * 7 + Math.sin(t * 40) * 0.25 + 8) % 8);
      g.fillStyle = bands[i]; g.fillRect(0, y, w, 1);
    }
    g.globalAlpha = 0.18;
    for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? "#e7c8ff" : "#241040"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 120, 3 + Math.random() * 7, 0, 0, 7); g.fill(); }
  });
}
function glowTex(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  return canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
}
const LABEL_STYLE = {
  idle: { bg: ["rgba(26,32,64,.95)", "rgba(14,18,40,.95)"], line: "#ffc53d", glow: "rgba(255,197,61,.7)", mark: "" },
  ok:   { bg: ["rgba(20,90,50,.95)", "rgba(10,60,32,.95)"], line: "#86efac", glow: "rgba(74,222,128,.9)", mark: "✓ " },
  bad:  { bg: ["rgba(110,20,30,.95)", "rgba(70,10,18,.95)"], line: "#fca5a5", glow: "rgba(248,113,113,.9)", mark: "✗ " },
};
function drawLabel(cv, text, style) {
  const g = cv.getContext("2d"), w = cv.width, h = cv.height, S = LABEL_STYLE[style];
  g.clearRect(0, 0, w, h);
  g.save(); g.shadowColor = S.glow; g.shadowBlur = 26;
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, S.bg[0]); gr.addColorStop(1, S.bg[1]);
  g.fillStyle = gr; g.beginPath(); g.roundRect(18, 18, w - 36, h - 36, 34); g.fill(); g.restore();
  g.lineWidth = 7; g.strokeStyle = S.line; g.beginPath(); g.roundRect(18, 18, w - 36, h - 36, 34); g.stroke();
  const t = S.mark + text;
  let fs = 104;
  g.font = `800 ${fs}px ${FONT}`;
  while (g.measureText(t).width > w - 90 && fs > 30) { fs -= 3; g.font = `800 ${fs}px ${FONT}`; }
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 8; g.shadowOffsetY = 3;
  g.fillText(t, w / 2, h / 2 + fs * 0.06);
}

// ------------------------------------------------------------------ shader
const SKY_SHADER = {
  uniforms: { uTime: { value: 0 }, uRot: { value: new THREE.Matrix3() },
    uB0: { value: new THREE.Color(0.035, 0.02, 0.09) }, uB1: { value: new THREE.Color(0.11, 0.04, 0.22) }, uN1: { value: new THREE.Color(0.42, 0.10, 0.55) },
    uN2: { value: new THREE.Color(0.08, 0.22, 0.55) }, uBand: { value: new THREE.Color(0.6, 0.25, 0.7) } },   // 1p: màu trời đổi theo thiên hà (intro)
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
  fragmentShader: `
    varying vec3 vDir; uniform float uTime; uniform mat3 uRot; uniform vec3 uB0; uniform vec3 uB1; uniform vec3 uN1; uniform vec3 uN2; uniform vec3 uBand;
    float h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float n(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(h(i+vec3(0,0,0)),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y), f.z); }
    float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * n(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){
      vec3 d0 = normalize(vDir), d = uRot * d0;           // 1i: tinh vân xoay chậm (lệch trục với sao ⇒ cảm giác 3D)
      float y = d0.y * 0.5 + 0.5;
      vec3 col = mix(uB0, uB1, smoothstep(0.1, 0.9, y));
      float neb = fbm(d * 2.4 + vec3(0.0, 0.0, uTime * 0.004));
      float neb2 = fbm(d * 5.0 + vec3(3.1, 1.7, 0.0));
      col += uN1 * pow(smoothstep(0.42, 0.85, neb), 1.6) * 0.9;
      col += uN2 * pow(smoothstep(0.5, 0.9, neb2), 2.0) * 0.8;
      col += uBand * pow(max(0.0, 1.0 - abs(d.y + 0.15) * 3.0), 3.0) * 0.12;
      gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    }`,
};
const ATMO_SHADER = {
  uniforms: { uColor: { value: new THREE.Color(0xb36bff) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV; uniform vec3 uColor; void main(){ float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 3.0); gl_FragColor = vec4(uColor * f * 1.6, f); }`,
};
const BEAM_SHADER = {
  uniforms: { uColor: { value: new THREE.Color(0x38bdf8) }, uOpacity: { value: 1 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
    // 1v: LỖI TOMKO — MSAA ngoại suy vUv.y > 1 ở mép ⇒ pow(số âm) = NaN ⇒ bloom loang thành khối đen ⇒ clamp trước pow
    // 2b: ghi chú này từ 1v tới 2a nằm GIỮA dòng shader ⇒ nuốt mất gl_FragColor + dấu } ⇒ shader không dịch được, cột sáng bệ biến mất
    void main(){ float a = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.7) * (0.6 + 0.4 * sin(vUv.y * 22.0 - uTime * 5.0)) * clamp(uOpacity, 0.0, 1.0);
      gl_FragColor = vec4(uColor * a, a); }`,
};
const GRADE_SHADER = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.18 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
      if (!(col.r == col.r) || !(col.g == col.g) || !(col.b == col.b) || (floatBitsToUint(col.r) & 0x7f800000u) == 0x7f800000u || (floatBitsToUint(col.g) & 0x7f800000u) == 0x7f800000u || (floatBitsToUint(col.b) & 0x7f800000u) == 0x7f800000u) col = vec3(0.0);
      float l = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(l), col, 1.08);
      vec2 q = vUv - 0.5; col *= 1.0 - uVig * dot(q, q) * 2.2;
      gl_FragColor = vec4(max(col, vec3(0.0)), c.a); }`,
};
const NAN_SHADER = {   // bẫy myGame: 1 điểm ảnh NaN bị bloom loang thành mảng đen ⇒ gột trước bloom
  uniforms: { tDiffuse: { value: null } },
  vertexShader: GRADE_SHADER.vertexShader,
  // 1v: kiểm NaN/Inf theo BIT (số mũ toàn 1) — trình dịch D3D (ANGLE) không bỏ được như c==c / isnan
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    bool badf(float x){ return (floatBitsToUint(x) & 0x7f800000u) == 0x7f800000u; }
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
    if (badf(c.r) || badf(c.g) || badf(c.b) || badf(c.a)) c = vec4(0.0, 0.0, 0.0, 1.0);
    c = clamp(c, vec4(0.0), vec4(64.0));
    if (any(isnan(c)) || any(isinf(c)) || !(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b) || c.r > 1e4 || c.g > 1e4 || c.b > 1e4) c = vec4(0.0, 0.0, 0.0, 1.0); gl_FragColor = c; }   // 1v: D3D (ANGLE) có thể bỏ phép c==c ⇒ thêm isnan/isinf`,
};

// ------------------------------------------------------------------ nhân vật
function std(o) { return new THREE.MeshStandardMaterial({ envMapIntensity: 0.55, ...o }); }
// 1n (thầy: "các bức tường thật hơn một chút, đôi khi có chỗ bụi bẩn cho chân thực"): chèn vào shader vật liệu chuẩn — theo TOẠ ĐỘ THẾ GIỚI
//   nên mỗi đoạn tường một kiểu (không lặp): mảng bẩn loang THỈNH THOẢNG mới có · bẩn đọng chân tường · vệt chảy dọc từ trên xuống · lớp bụi
//   xám trên mặt ngang · đường ghép tấm mảnh · hạt sần li ti. Chỗ bẩn nhám hơn (bớt bóng).
function grime(mat, amt) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uDirt = { value: amt };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vGW; varying vec3 vGN;")
      .replace("#include <project_vertex>", `#include <project_vertex>
        { vec4 gw = vec4(transformed, 1.0); vec3 gn = objectNormal;
          #ifdef USE_INSTANCING
          gw = instanceMatrix * gw; gn = mat3(instanceMatrix) * gn;
          #endif
          gw = modelMatrix * gw; vGW = gw.xyz; vGN = normalize(mat3(modelMatrix) * gn); }`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
        varying vec3 vGW; varying vec3 vGN; uniform float uDirt;
        float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float gn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gh(i), gh(i + vec2(1, 0)), f.x), mix(gh(i + vec2(0, 1)), gh(i + vec2(1, 1)), f.x), f.y); }
        float gfb(vec2 p){ return gn2(p) * 0.55 + gn2(p * 2.1 + 3.1) * 0.28 + gn2(p * 4.3 + 7.7) * 0.17; }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float gDirt = 0.0;
        {
          vec3 N = normalize(vGN); float side = 1.0 - smoothstep(0.5, 0.8, abs(N.y));
          float u = vGW.x + vGW.z, v = vGW.y;
          float blot = smoothstep(0.5, 0.7, gfb(vec2(u * 0.42, v * 0.8) + 11.3));                     // mảng bẩn loang (thỉnh thoảng)
          float foot = (1.0 - smoothstep(0.0, 0.75, v)) * (0.45 + 0.55 * gfb(vec2(u * 1.4, 2.0)));      // đọng chân tường
          float drip = smoothstep(0.62, 0.9, gn2(vec2(u * 4.5, 0.5))) * (0.35 + 0.65 * gn2(vec2(u * 4.5, v * 1.3))) * smoothstep(0.1, 1.2, v);   // vệt chảy
          gDirt = clamp(blot * 0.85 + foot * 0.75 + drip * 0.55, 0.0, 1.0) * side * uDirt;
          vec3 dirtC = vec3(0.12, 0.1, 0.08);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.3 + dirtC * 0.55, gDirt * 0.9);
          float dust = (1.0 - side) * smoothstep(0.45, 0.8, gfb(vGW.xz * 0.9 + 5.0)) * 0.4 * uDirt;          // bụi trên mặt ngang
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.48, 0.45) * 0.55, dust);
          float seam = side * (1.0 - smoothstep(0.0, 0.035, abs(fract(u * 0.5) - 0.5) - 0.465)) * 0.0;
          float line = side * (1.0 - smoothstep(0.012, 0.03, abs(v - 0.92))) * 0.22;                          // đường ghép tấm ngang
          float vline = side * (1.0 - smoothstep(0.012, 0.03, abs(fract(u * 0.5 + 0.25) - 0.5) * 2.0)) * 0.18;  // đường ghép dọc (mỗi 2 đơn vị)
          diffuseColor.rgb *= (1.0 - line - vline - seam) * (0.95 + 0.1 * gn2(vec2(u * 22.0, v * 22.0)));   // + hạt sần li ti
          gDirt = max(gDirt, dust);
        }`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = min(1.0, roughnessFactor + gDirt * 0.4);`);
  };
  mat.customProgramCacheKey = () => "grime";
}
// ---- MẪU 1b: phi hành gia + robot địch chi tiết hơn (thầy 29/9: "hơi xấu, cần chi tiết hơn nữa")
// 2d: khớp cổ chân (so với hông) và đáy đế (so với hông) — dùng để giữ đế phẳng + tính độ cao thân cho bàn chân chạm ĐÚNG mặt boong
const HIP_Y = 0.66, ANK_Y = -0.55, SOLE_Y = -0.672;
// đặt chân theo góc hông (legs[i].rotation.x) + độ nhấc chân bước (lift[i]): cổ chân bù góc ⇒ đế phẳng; thân hạ/nâng để đế THẤP NHẤT chạm boong (không lơ lửng, không lún)
function plantFeet(R, lift = [0, 0]) {
  let lo = 9;
  R.legs.forEach((lg, i) => {
    const th = lg.rotation.x, a = lg.userData.ank; lg.position.y = HIP_Y + lift[i];
    if (a) a.rotation.x = -th;
    const bottom = HIP_Y + lift[i] + ANK_Y * Math.cos(th) + (SOLE_Y - ANK_Y);   // đáy đế của chân này (toạ độ thân)
    lo = Math.min(lo, bottom);
  });
  R.body.position.y = (HIP_Y + SOLE_Y) - lo;                                    // đứng thẳng: lo = HIP_Y + SOLE_Y ⇒ 0
}
// 2d: KHỰNG lúc tường dựng + địch trồi — cảnh có ~3.700 vật, ~1.700 đang ẨN (xác tàu, mảnh nổ, kho dự phòng…) mà three.js vẫn tính lại ma trận
//     mỗi khung (updateMatrixWorld ≈ 12 % CPU). Nhánh đang ẩn ⇒ bỏ qua, nhớ là "cũ"; hiện lại ⇒ cập nhật ép cả nhánh. (getWorldPosition… dùng
//     updateWorldMatrix riêng ⇒ không ảnh hưởng.)
if (!THREE.Object3D.prototype.__skipHidden) {
  const umw = THREE.Object3D.prototype.updateMatrixWorld;
  THREE.Object3D.prototype.updateMatrixWorld = function (force) {
    if (!this.visible && this.parent) { this.__mwStale = true; return; }
    if (this.__mwStale) { this.__mwStale = false; force = true; }
    return umw.call(this, force);
  };
  THREE.Object3D.prototype.__skipHidden = true;
}
function makeAstronaut() {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  // 1g: thầy "robot mình chói, khó nhìn" ⇒ bộ đồ xám-xanh nhạt thay trắng tinh, nhám hơn, bớt phản chiếu môi trường
  const suit = std({ color: 0x8290a6, roughness: 0.8, metalness: 0.02, envMapIntensity: 0.15 });
  const fabric = std({ color: 0x5f6b82, roughness: 0.85, metalness: 0 });
  const dark = std({ color: 0x2b3345, roughness: 0.45, metalness: 0.7 });
  const blue = std({ color: 0x2563eb, roughness: 0.4, metalness: 0.2, emissive: 0x1d4ed8, emissiveIntensity: 0.25 });
  const gold = std({ color: 0xffc861, metalness: 1, roughness: 0.14, envMapIntensity: 1.6 });
  const glass = std({ color: 0x0f172a, metalness: 0.9, roughness: 0.1, envMapIntensity: 1.4 });
  const lamp = std({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 0.9 });
  const mk = (geo, mat, x, y, z, parent = body, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m; };

  // thân
  const torso = mk(new THREE.CapsuleGeometry(0.44, 0.34, 8, 20), suit, 0, 1.02, 0); torso.scale.z = 0.86;
  const belt = mk(new THREE.TorusGeometry(0.42, 0.065, 10, 32), dark, 0, 0.78, 0); belt.rotation.x = Math.PI / 2; belt.scale.y = 0.86;
  mk(new THREE.BoxGeometry(0.16, 0.1, 0.06), gold, 0, 0.78, 0.37);
  const collar = mk(new THREE.TorusGeometry(0.33, 0.08, 10, 32), dark, 0, 1.4, 0); collar.rotation.x = Math.PI / 2;
  // bảng điều khiển ngực
  mk(new THREE.BoxGeometry(0.44, 0.28, 0.07), dark, 0, 1.1, 0.37);
  mk(new THREE.BoxGeometry(0.2, 0.1, 0.02), std({ color: 0x0b3b4a, emissive: 0x22d3ee, emissiveIntensity: 0.9 }), -0.08, 1.15, 0.41, body, false);
  [[0xef4444, 0.1], [0x22c55e, 0.16], [0xfacc15, 0.22]].forEach(([c, x]) =>
    mk(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12), std({ color: c, emissive: c, emissiveIntensity: 1.4 }), x - 0.06, 1.05, 0.41, body, false).rotation.x = Math.PI / 2);
  mk(new THREE.BoxGeometry(0.14, 0.05, 0.02), blue, -0.18, 1.3, 0.35, body, false);   // phù hiệu vai trái
  // mũ
  const helmet = new THREE.Group(); helmet.position.y = 1.8; body.add(helmet);
  mk(new THREE.SphereGeometry(0.5, 32, 24), suit, 0, 0, 0, helmet);
  mk(new THREE.SphereGeometry(0.505, 32, 16, Math.PI / 2 - 1.0, 2.0, 0.85, 1.15), gold, 0, 0, 0, helmet, false);
  [-1, 1].forEach(s => {
    const ear = mk(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 18), fabric, s * 0.49, 0.02, 0, helmet); ear.rotation.z = Math.PI / 2;
    const l = mk(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 12), lamp, s * 0.43, 0.24, 0.2, helmet, false); l.rotation.x = Math.PI / 2;
  });
  mk(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6), dark, 0.2, 0.55, -0.12, helmet);
  const tip = mk(new THREE.SphereGeometry(0.055, 12, 8), std({ color: 0xff4d6d, emissive: 0xff4d6d, emissiveIntensity: 1.4 }), 0.2, 0.74, -0.12, helmet, false);
  // ba lô
  mk(new THREE.BoxGeometry(0.68, 0.78, 0.32), suit, 0, 1.08, -0.46);
  mk(new THREE.BoxGeometry(0.5, 0.5, 0.04), fabric, 0, 1.12, -0.63);
  // 1h: khắc ANDREW CLASSES lên mặt ba lô (thay 3 gờ tối) — rãnh chữ tối + viền sáng mảnh như chữ dập kim loại
  { const cv = document.createElement("canvas"); cv.width = 512; cv.height = 320; const x = cv.getContext("2d");
    x.fillStyle = "#6b768c"; x.fillRect(0, 0, 512, 320);
    x.strokeStyle = "#3a4356"; x.lineWidth = 5; x.strokeRect(8, 8, 496, 304);
    x.textAlign = "center"; x.textBaseline = "middle";
    [["ANDREW", 102], ["TEAM", 226]].forEach(([t, y]) => {
      x.font = "900 118px 'Arial Black', Arial, sans-serif";
      x.fillStyle = "rgba(225,232,244,.55)"; x.fillText(t, 258, y + 4, 488);     // mép sáng dưới rãnh
      x.fillStyle = "#262d3c"; x.fillText(t, 256, y, 488);                         // rãnh khắc
    });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const plate = mk(new THREE.PlaneGeometry(0.56, 0.35), std({ map: t, roughness: 0.75, metalness: 0.1 }), 0, 1.13, -0.652, body, false);
    plate.rotation.y = Math.PI; }
  [-1, 1].forEach(s => { const t = mk(new THREE.CylinderGeometry(0.1, 0.1, 0.62, 16), blue, s * 0.37, 1.1, -0.5); t.material = blue; });
  const jets = [-0.16, 0.16].map(x => mk(new THREE.CylinderGeometry(0.08, 0.12, 0.16, 14), std({ color: 0x1e293b, emissive: 0x60a5fa, emissiveIntensity: 0 }), x, 0.64, -0.5));
  // tay: vai → khuỷu → găng
  const arms = [-1, 1].map(s => {
    const pv = new THREE.Group(); pv.position.set(s * 0.5, 1.3, 0); body.add(pv);
    mk(new THREE.SphereGeometry(0.17, 16, 12), suit, 0, 0, 0, pv);
    const up = mk(new THREE.CapsuleGeometry(0.12, 0.22, 4, 12), suit, s * 0.04, -0.22, 0, pv); up.rotation.z = s * 0.12;
    mk(new THREE.TorusGeometry(0.12, 0.03, 6, 16), blue, s * 0.06, -0.3, 0, pv).rotation.x = Math.PI / 2;
    // 1h: cẳng tay + găng gắn vào KHUỶU riêng (gập được để giơ tay chào)
    const el = new THREE.Group(); el.position.set(s * 0.06, -0.36, 0.01); pv.add(el);
    mk(new THREE.CapsuleGeometry(0.11, 0.2, 4, 12), fabric, s * 0.01, -0.14, 0.01, el);
    // 1r: bàn tay chi tiết — mu bàn tay + 4 ngón (2 đốt, hơi co) + ngón cái chìa ra trước
    const hand = new THREE.Group(); hand.position.set(s * 0.02, -0.33, 0.02); el.add(hand);
    const palm = mk(new THREE.SphereGeometry(0.1, 14, 10), dark, 0, 0, 0, hand); palm.scale.set(0.72, 1, 1.05);
    mk(new THREE.TorusGeometry(0.085, 0.022, 6, 16), blue, 0, 0.06, 0, hand).rotation.x = Math.PI / 2;    // cổ găng
    [-0.054, -0.018, 0.018, 0.054].forEach((z, i) => {
      const len = [0.06, 0.07, 0.068, 0.056][i];
      const f1 = new THREE.Group(); f1.position.set(-s * 0.012, -0.075, z); f1.rotation.x = 0; f1.rotation.z = s * 0.18; hand.add(f1);
      mk(new THREE.CapsuleGeometry(0.019, len * 0.55, 3, 8), dark, 0, -len * 0.45, 0, f1);
      const f2 = new THREE.Group(); f2.position.set(0, -len * 0.9, 0); f2.rotation.z = s * 0.35; f1.add(f2);
      mk(new THREE.CapsuleGeometry(0.017, len * 0.45, 3, 8), dark, 0, -len * 0.35, 0, f2);
    });
    const th = new THREE.Group(); th.position.set(-s * 0.03, -0.03, 0.07); th.rotation.set(0.7, 0, s * 0.35); hand.add(th);
    mk(new THREE.CapsuleGeometry(0.021, 0.05, 3, 8), dark, 0, -0.045, 0, th);
    pv.userData.el = el;
    return pv;
  });
  // chân: hông → gối → ủng
  const legs = [-1, 1].map(s => {
    const pv = new THREE.Group(); pv.position.set(s * 0.2, 0.66, 0); body.add(pv);
    mk(new THREE.CapsuleGeometry(0.15, 0.16, 4, 12), suit, 0, -0.14, 0, pv);
    mk(new THREE.SphereGeometry(0.1, 12, 8), blue, 0, -0.3, 0.1, pv);
    mk(new THREE.CapsuleGeometry(0.13, 0.12, 4, 12), fabric, 0, -0.42, 0, pv);
    // 2d: CỔ CHÂN — ủng + ngón + đế + gót nằm trong nhóm `ank` (khớp ở −0,55): chân đung đưa thì cổ chân xoay ngược ⇒ đế luôn PHẲNG trên boong
    const ank = new THREE.Group(); ank.position.set(0, ANK_Y, 0); pv.add(ank); pv.userData.ank = ank;
    const A = y => y - ANK_Y;
    const boot = mk(new THREE.BoxGeometry(0.26, 0.14, 0.3), dark, 0, A(-0.6), 0.02, ank);
    mk(new THREE.BoxGeometry(0.27, 0.04, 0.31), blue, 0, A(-0.52), 0.02, ank, false);
    // 1r: 3 ngón chân bo tròn ở mũi ủng + khớp ngón + đế gai + gót
    [[-0.075, 0.075, 0.055], [0, 0.085, 0.06], [0.075, 0.07, 0.05]].forEach(([x, len, r]) => {
      const t = mk(new THREE.CapsuleGeometry(r, len, 4, 10), dark, x, A(-0.672 + r * 0.8), 0.19 + len * 0.3, ank); t.rotation.x = Math.PI / 2; t.scale.set(1, 1, 0.78);   // 1t: đáy ngón = đáy ủng
      mk(new THREE.TorusGeometry(r * 0.92, 0.012, 5, 12), blue, x, A(-0.622), 0.17, ank, false);
    });
    for (let i = 0; i < 4; i++) mk(new THREE.BoxGeometry(0.28, 0.025, 0.035), std({ color: 0x151a24, roughness: 0.9 }), 0, A(-0.66), -0.1 + i * 0.085, ank, false);   // 1t: gai đế không thò dưới đáy
    mk(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 14, 1, false, 0, Math.PI), dark, 0, A(-0.61), -0.13, ank).rotation.set(0, Math.PI / 2, Math.PI / 2);
    void boot;
    return pv;
  });
  g.scale.setScalar(1.75);
  // 1h: bị địch đụng ⇒ cả người chuyển ĐỎ (giữ nguyên hình); nhớ màu gốc để trả lại
  const mats = new Set(); g.traverse(o => { if (o.isMesh && o.material.color) mats.add(o.material); });
  mats.forEach(m => { m.userData.c0 = m.color.clone(); m.userData.e0 = m.emissive.clone(); m.userData.i0 = m.emissiveIntensity; });
  const RED = new THREE.Color(0xdc2626), RED_E = new THREE.Color(0x991b1b);
  function setRed(on) {                                   // 2b: on = true/false hoặc độ đỏ 0–1 (nhấp nháy nhẹ khi bị địch đụng)
    const k = on === true ? 1 : on === false ? 0 : Math.max(0, Math.min(1, +on || 0));
    mats.forEach(m => { m.color.copy(m.userData.c0); if (k > 0) m.color.lerp(RED, 0.8 * k); m.emissive.copy(m.userData.e0).lerp(RED_E, k); m.emissiveIntensity = m.userData.i0 + (0.55 - m.userData.i0) * k; });
  }
  return { g, body, legs, arms, elbows: arms.map(a => a.userData.el), jets, tip, setRed };
}
function makeDrone(color) {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  const C = new THREE.Color(color);
  const hull = std({ color: C, metalness: 0.35, roughness: 0.38, envMapIntensity: 0.35 });
  const dark = std({ color: 0x1a1d2b, metalness: 0.75, roughness: 0.35 });
  const steel = std({ color: 0x8c93a8, metalness: 0.85, roughness: 0.28 });
  const glowC = C.clone().lerp(new THREE.Color(0xffffff), 0.35);
  const glow = std({ color: glowC, emissive: glowC, emissiveIntensity: 2.6 });
  const mk = (geo, mat, x, y, z, parent = body, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m; };

  // vỏ 2 nửa, khe sáng giữa
  mk(new THREE.SphereGeometry(0.68, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hull, 0, 0.06, 0);
  mk(new THREE.SphereGeometry(0.64, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), dark, 0, -0.04, 0);
  const band = mk(new THREE.TorusGeometry(0.66, 0.045, 8, 40), glow, 0, 0.01, 0, body, false); band.rotation.x = Math.PI / 2;
  // tấm giáp trên + vạch
  const crown = mk(new THREE.CylinderGeometry(0.3, 0.42, 0.16, 6), dark, 0, 0.68, 0); crown.rotation.y = Math.PI / 6;
  const collar = mk(new THREE.TorusGeometry(0.5, 0.05, 8, 36), steel, 0, 0.5, 0, body, false); collar.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) mk(new THREE.BoxGeometry(0.03, 0.2, 0.02), dark, -0.3 + i * 0.07, 0.3, -0.63, body, false);   // khe tản nhiệt sau lưng
  // mắt: khe ngang phát sáng trên mặt nạ tối
  mk(new THREE.SphereGeometry(0.695, 32, 12, Math.PI / 2 - 0.85, 1.7, 1.2, 0.5), dark, 0, 0.06, 0, body, false);
  const eye = mk(new THREE.CapsuleGeometry(0.06, 0.5, 4, 12), std({ color: glowC, emissive: glowC, emissiveIntensity: 3.2 }), 0, 0.2, 0.64, body, false);
  eye.rotation.z = Math.PI / 2; eye.scale.z = 0.45;
  const pupil = mk(new THREE.SphereGeometry(0.1, 14, 10), std({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 }), 0, 0.2, 0.68, body, false);
  // ăng-ten
  mk(new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6), steel, 0.12, 0.95, -0.05);
  const tip = mk(new THREE.SphereGeometry(0.06, 10, 8), glow, 0.12, 1.16, -0.05, body, false);
  // tay kẹp 2 bên
  const arms = [-1, 1].map(s => {
    const pv = new THREE.Group(); pv.position.set(s * 0.66, -0.02, 0.05); body.add(pv);
    mk(new THREE.SphereGeometry(0.13, 14, 10), dark, 0, 0, 0, pv);
    const a1 = mk(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 8), steel, s * 0.14, -0.14, 0.06, pv); a1.rotation.z = s * 0.8;
    mk(new THREE.SphereGeometry(0.075, 10, 8), dark, s * 0.27, -0.26, 0.1, pv);
    const a2 = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 8), steel, s * 0.3, -0.4, 0.2, pv); a2.rotation.x = 0.7;
    mk(new THREE.SphereGeometry(0.07, 10, 8), dark, s * 0.3, -0.52, 0.31, pv);
    [-1, 1].forEach(k => { const cl = mk(new THREE.ConeGeometry(0.035, 0.18, 6), steel, s * 0.3 + k * 0.045, -0.56, 0.4, pv); cl.rotation.x = Math.PI / 2 + 0.5; cl.rotation.z = -k * 0.3; });
    return pv;
  });
  // vây sau
  [-1, 1].forEach(s => { const f = mk(new THREE.BoxGeometry(0.05, 0.3, 0.34), hull, s * 0.24, 0.36, -0.6); f.rotation.z = s * 0.3; });
  // động cơ dưới + lửa
  mk(new THREE.CylinderGeometry(0.26, 0.2, 0.2, 18), dark, 0, -0.66, 0);
  const noz = mk(new THREE.TorusGeometry(0.2, 0.04, 8, 24), glow, 0, -0.76, 0, body, false); noz.rotation.x = Math.PI / 2;
  const flame = mk(new THREE.ConeGeometry(0.19, 0.6, 18, 1, true), new THREE.MeshBasicMaterial({ color: glowC, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -1.06, 0, body, false);
  flame.rotation.x = Math.PI;
  g.scale.setScalar(1.6);
  return { g, body, arms, flame, tip, pupil };
}

// ================================================================== GAME
export async function createMazeChase({ mount, view = "tilt", questions, title = "", act = "", intro: introV = null, options = null, host = null, remote = null }) {
  introV = new URLSearchParams(location.search).get("intro") || introV;   // 1o: bản intro (a | b | c)
  const V = VIEWS[view] || VIEWS.tilt;
  const opt = { ...DEFAULTS };
  // 2n: Options đã lưu của act (AWord) — chỉ nhận đúng khoá + đúng kiểu, sai thì giữ mặc định
  if (options && typeof options === "object") Object.keys(DEFAULTS).forEach(k => { if (k in options && typeof options[k] === typeof DEFAULTS[k]) opt[k] = options[k]; });
  if (new URLSearchParams(location.search).get("fight") === "1") opt.fight = true;
  let fight = opt.fight;                           // 1u: Fight 2 đội
  // 2n: mọi listener gắn lên window/document đi qua on() ⇒ destroy() gỡ sạch; `dead` chặn vòng vẽ + hẹn giờ còn sót
  const offs = []; let dead = false;
  const on = (t, type, fn, o) => { t.addEventListener(type, fn, o); offs.push(() => t.removeEventListener(type, fn, o)); };
  const sfx = createMcSound();
  try { await document.fonts.load(`800 60px ${FONT}`); await document.fonts.load(`700 60px ${FONT}`); } catch (e) { /* font dự phòng */ }

  mount.classList.add("mc-root");   // 2n: lớp gốc thay #game (CSS) — myGame vẫn dùng <div id="game">
  mount.innerHTML = HUD_HTML;
  const stage = mount.querySelector(".mc-stage");
  const $ = s => stage.querySelector(s);
  const canvas = $(".mc-gl");
  { const ck = $(".mc-clock"); mount.querySelector(".mc-outbar").prepend(ck); }   // 2d: đồng hồ LED xuống DÃY NÚT, ngoài cùng bên trái
  const clockWrap = mount.querySelector(".mc-outbar .mc-clock");
  const topEl = $(".mc-top"), clockEl = mount.querySelector(".mc-clock b"), qEl = $(".mc-q"), qSpan = $(".mc-q span"), livesEl = $(".mc-lives"), scoreEl = $(".mc-score b");
  const bigq = $(".mc-bigq"), countEl = $(".mc-count"), mini = $(".mc-mini"), bar = { hidden: false };   // 1e: thanh nút ở ngoài, luôn hiện
  const swapEl = $(".mc-swap"), countN = $(".mc-count .cd-n"), bombsEl = $(".mc-bombs");
  const $$ = s => mount.querySelector(s);
  const progEl = $$(".mc-prog"), progFill = $$(".mc-prog i"); let pctNow = 0;
  const paintPct = () => { pctNow = Math.round(100 * Math.min(1, qi / Math.max(1, results.length))); progFill.style.width = pctNow + "%"; };   // 1m: thanh mảnh chạy trái → phải theo % câu đã chơi
  const dpads = { l: $(".mc-dpad.is-l"), r: $(".mc-dpad.is-r") };
  const ovStart = $(".mc-ov-start"), ovPause = $(".mc-ov-pause"), ovEnd = $(".mc-ov-end");
  $(".mc-kicker").textContent = "Andrew Classes fleet · mission";
  $(".mc-sub").textContent = `${questions.length} questions${title ? " · " + title : ""}`;

  // ---------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });   // 2p: AA nằm ở composer (MSAA)
  const PR_MAX = Math.min(window.devicePixelRatio || 1, 1.5);
  let PR = PR_MAX;   // 2p: mc3d-autoq-2p.js hạ/nâng (trần `__awMaxPR` áp ở khung đầu)
  renderer.debug.checkShaderErrors = !!new URLSearchParams(location.search).get("glcheck");   // 2p: đo — hỏi log lỗi shader (getProgramInfoLog) ở lần dùng đầu bắt luồng chính CHỜ card dịch xong (16–19 ms/lần); ?glcheck=1 bật lại khi cần dò lỗi
  renderer.setPixelRatio(PR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(V.fov, ASPECT, 0.3, 5000);
  let aspect = ASPECT;                              // 1v: Fight đổi theo cửa sổ (đúng khung Rocket Race Fight)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  let composer = null, stageW = 1, stageH = 1;
  function fit() {
    const Wn = mount.clientWidth || window.innerWidth, Hn = (mount.clientHeight || window.innerHeight) - BAR_H;   // 2n: đo CHÍNH ô mount · 1e: chừa thanh nút bên dưới
    let w = Wn, h = Wn / ASPECT;
    w = Wn; h = Math.max(120, Math.min(Wn / 2, Hn));                    // 2o: MỌI mode = khung Rocket Race: rộng hết, cao = min(rộng/2, ô − dải nút)
    stageW = Math.floor(w); stageH = Math.floor(h); aspect = stageW / stageH; camera.aspect = aspect; camera.updateProjectionMatrix();
    stage.style.width = stageW + "px"; stage.style.height = stageH + "px"; progEl.style.width = stageW + "px";   // 1m: thanh tiến độ dài đúng bằng khung game
    renderer.setSize(stageW, stageH, false);
    if (composer) { composer.setPixelRatio(PR); composer.setSize(stageW, stageH); }
    if (portalObj) portalObj.setSize(stageW * PR, stageH * PR);
    const r = mini.getBoundingClientRect();
    mini.width = Math.max(2, Math.round(r.width * PR)); mini.height = Math.max(2, Math.round(r.height * PR));
    miniBase = null;
  }
  let miniBase = null, portalObj = null;
  on(window, "resize", () => relayout());
  on(document, "fullscreenchange", () => relayout());
  // 2n: ô mount đổi cỡ mà cửa sổ không đổi (AWord: thanh cuộn, cột myActivity) ⇒ vẫn vẽ lại khung
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (!dead) relayout(); }); ro.observe(mount); offs.push(() => ro.disconnect()); }

  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(NAN_SHADER));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.4, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass(GRADE_SHADER));
  fit();
  // 2p: tự giữ 60 khung — đổi độ nét / MSAA chỉ cấp lại bộ đệm vẽ (không dựng lại cảnh, không dịch lại shader)
  const AQ = makeAutoQuality({ max: PR_MAX, min: Math.min(0.8, PR_MAX), key: fight ? "fight" : "single", apply: ({ pr, msaa }) => {
    if (dead) return;
    PR = pr; renderer.setPixelRatio(pr);
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) if (rt.samples !== msaa) { rt.samples = msaa; rt.dispose(); }
    fit();
  } });

  // ---------------------------------------------------------------- vũ trụ
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), new THREE.ShaderMaterial({ ...SKY_SHADER, side: THREE.BackSide, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  function stars(n, size, rad) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(rad);
      pos.set([v.x, v.y, v.z], i * 3);
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.25, 0.5, 0.75 + Math.random() * 0.25);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.renderOrder = -9; scene.add(p); return p;
  }
  // 1j: 4 TẦNG SAO (rất nhiều sao li ti mờ → ít sao sáng), cỡ nhỏ hơn, mỗi sao lấp lánh nhịp riêng, thỉnh thoảng loé
  const STAR_VS = `attribute float aSize; attribute float aPh; attribute float aTw; attribute vec3 aCol; uniform float uTime; uniform float uPR; varying vec3 vCol;
    void main(){ float tw = 1.0 - aTw * 0.55 * (0.5 + 0.5 * sin(uTime * (0.5 + fract(aPh) * 2.6) + aPh * 6.2831));
      float spark = pow(max(0.0, sin(uTime * 0.31 + aPh * 17.0)), 90.0) * aTw * 1.8;
      vCol = aCol * (tw + spark);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uPR * (1.0 + spark * 0.5); }`;
  const STAR_FS = `varying vec3 vCol; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, r); gl_FragColor = vec4(vCol * a * a, 1.0); }`;
  const starU = { uTime: { value: 0 }, uPR: { value: PR } };
  const starLayers = [[5200, 0.7, 1.2, 0.25, 0.55, 1650, 0.3], [1900, 1.1, 1.7, 0.5, 0.95, 1550, 0.55], [420, 1.6, 2.5, 0.85, 1.4, 1480, 0.8], [46, 2.3, 3.3, 1.3, 2.1, 1420, 1]].map(([n, s0, s1, b0, b1, rad, tw]) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n), twa = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(rad); pos.set([v.x, v.y, v.z], i * 3);
      const c = new THREE.Color().setHSL(Math.random() < 0.15 ? 0.08 + Math.random() * 0.06 : 0.55 + Math.random() * 0.12, 0.45 + Math.random() * 0.3, 0.8), b = b0 + Math.random() * (b1 - b0);
      col.set([c.r * b, c.g * b, c.b * b], i * 3); sz[i] = s0 + Math.random() * (s1 - s0); ph[i] = Math.random() * 10; twa[i] = Math.random() < tw ? 0.4 + Math.random() * 0.6 : 0;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1)); geo.setAttribute("aPh", new THREE.BufferAttribute(ph, 1)); geo.setAttribute("aTw", new THREE.BufferAttribute(twa, 1));
    const p = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: starU, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.renderOrder = -9; p.frustumCulled = false; scene.add(p); return p;
  });
  let skyAxis = null, skyAxis2 = null, skyN = 0;
  const planet = new THREE.Mesh(new THREE.SphereGeometry(170, 64, 48), std({ map: planetTex(), roughness: 0.85, metalness: 0, envMapIntensity: 0.2 }));
  planet.position.set(-300, -160, -640); planet.rotation.z = 0.35; scene.add(planet);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(182, 48, 32), new THREE.ShaderMaterial({ ...ATMO_SHADER, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }));
  atmo.position.copy(planet.position); scene.add(atmo);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(46, 40, 30), std({ color: 0x5d7bd8, roughness: 0.7, emissive: 0x0a1540, emissiveIntensity: 0.4 }));
  moon.position.set(460, 90, -980); scene.add(moon);
  const ringM = new THREE.Mesh(new THREE.RingGeometry(62, 96, 64), new THREE.MeshBasicMaterial({ color: 0x9fb7ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  ringM.position.copy(moon.position); ringM.rotation.set(1.2, 0.3, 0.2); scene.add(ringM);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,220,180,1)", "rgba(255,120,200,0)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sun.position.set(900, 420, -1500); sun.scale.setScalar(520); scene.add(sun);

  // ánh sáng
  const hemi = new THREE.HemisphereLight(0xc8d4ff, 0x2e2a48, 0.75); scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xfff1e0, 2.6);
  sunL.position.set(26, 50, 22); sunL.castShadow = true;
  sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 140 });
  sunL.shadow.bias = -0.0006; sunL.shadow.normalBias = 0.03;
  scene.add(sunL);
  const rim = new THREE.DirectionalLight(0xc084fc, 0.9); rim.position.set(-30, 20, -40); scene.add(rim);
  const graze = new THREE.DirectionalLight(0xdbe7ff, 0.7); graze.position.set(-40, 12, 30); scene.add(graze);   // 1d: nắng xiên thấp làm nổi gân/rãnh sàn

  // ---------------------------------------------------------------- trạm vũ trụ
  const station = new THREE.Group(); scene.add(station);
  const DECK_T = 3.6;                                       // 1r: độ dày sàn trạm (1,2 ⇒ 3,6)
  const metal = std({ color: 0x2a3148, metalness: 0.8, roughness: 0.4 });
  const under = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.42, D * 0.2, 6, 8), std({ color: 0x1c2133, metalness: 0.8, roughness: 0.5 }));
  under.position.y = -4.4; under.rotation.y = Math.PI / 8; under.scale.x = 2.1;   // 1c: bỏ — map có ô trống thì lộ khối tối
  // 1d: sàn PBR — 4 lớp vẽ bằng canvas (mc3d-floor.js)
  const deck = createDeckPainter(COLS, ROWS), dc = deck.canvases;
  const deckTex = k => { const t = new THREE.CanvasTexture(dc[k]); t.anisotropy = 16; if (k === "color" || k === "emit") t.colorSpace = THREE.SRGBColorSpace; return t; };
  const floorTex = deckTex("color"), floorNrm = deckTex("normal"), floorRgh = deckTex("rough"), floorEmi = deckTex("emit");
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std({
    map: floorTex, alphaTest: 0.5, normalMap: floorNrm, normalScale: new THREE.Vector2(1.3, 1.3),
    roughnessMap: floorRgh, roughness: 1, metalness: 0.5, emissiveMap: floorEmi, emissive: 0xffffff, emissiveIntensity: 1.6, envMapIntensity: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.005; floor.receiveShadow = true; station.add(floor);
  const floorBot = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std({ map: floorTex, alphaTest: 0.5, color: 0x3a3f50, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 }));
  floorBot.rotation.x = -Math.PI / 2; floorBot.position.y = -DECK_T; station.add(floorBot);
  const solar = solarTex();
  // 1x: thanh giằng chạy LIỀN từ mép mê cung thật (map khuyết thì vẫn chạm tường) ra hết cánh pin; cánh pin xoay quanh thanh giằng
  const solarMat = std({ map: solar, metalness: 0.85, roughness: 0.22, envMapIntensity: 1.1 });
  const WING_GAP = 4.2, WING_L = 16, PANEL_D = 11;
  const wings = [-1, 1].map((s, i) => {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 1.2), metal); truss.castShadow = true; station.add(truss);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 1.9), metal); station.add(collar);        // khớp ốp vào mép sàn
    const pivot = new THREE.Group(); station.add(pivot);
    for (const z of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(WING_L, 0.18, PANEL_D), solarMat); p.position.set(0, 0, z * (0.72 + PANEL_D / 2)); p.castShadow = true; pivot.add(p);
      for (const x of [-WING_L * 0.42, 0, WING_L * 0.42]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.5), metal); b.position.set(x, 0, z * 0.72); pivot.add(b); }   // bản lề nối cánh vào thanh
    }
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 1.6), metal); station.add(tip);
    return { s, truss, collar, pivot, tip, ph: i * 2.1 + 0.7 };
  });
  function placeWings() {                                   // gọi mỗi lần dựng map: mép thật của hàng giữa (z = 0)
    const r = Math.floor(ROWS / 2);
    wings.forEach(w => {
      let c = w.s < 0 ? 0 : COLS - 1; while (grid && !grid[r][c].on && c - w.s >= 0 && c - w.s < COLS) c -= w.s;
      const edge = cellX(c) + w.s * CELL / 2, x0 = edge - w.s * 1.2, root = edge + w.s * WING_GAP, x1 = root + w.s * (WING_L + 0.6);
      w.truss.scale.x = Math.abs(x1 - x0); w.truss.position.set((x0 + x1) / 2, -DECK_T / 2, 0);
      w.collar.position.set(edge + w.s * 0.35, -DECK_T / 2, 0);
      w.pivot.position.set(root + w.s * WING_L / 2, -DECK_T / 2 - 0.05, 0);
      w.tip.position.set(x1, -DECK_T / 2, 0);
    });
  }
  const beacons = [];

  // ---------------------------------------------------------------- tường (InstancedMesh, dựng lại MỖI câu)
  const MAXW = (ROWS + 1) * COLS + (COLS + 1) * ROWS, MAXP = (ROWS + 1) * (COLS + 1);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const wallMesh = new THREE.InstancedMesh(boxGeo, std({ color: 0x1745c8, metalness: 0.1, roughness: 0.45, envMapIntensity: 0.1 }), MAXW);
  const capMesh = new THREE.InstancedMesh(boxGeo, std({ color: 0x1f5fff, emissive: 0x2f7bff, emissiveIntensity: 0.55, roughness: 0.35, envMapIntensity: 0.1 }), MAXW);
  const postMesh = new THREE.InstancedMesh(boxGeo, std({ color: 0x1238a8, metalness: 0.1, roughness: 0.45, envMapIntensity: 0.1 }), MAXP);
  const postCap = new THREE.InstancedMesh(boxGeo, std({ color: 0x0b2a6b, emissive: 0x60a5fa, emissiveIntensity: 1.1 }), MAXP);
  [wallMesh, postMesh].forEach(m => { m.castShadow = true; m.receiveShadow = true; });
  grime(wallMesh.material, 1); grime(postMesh.material, 0.9); grime(capMesh.material, 0.45);   // 1n: tường thật hơn, có chỗ bụi bẩn
  const skirtMesh = new THREE.InstancedMesh(boxGeo, std({ color: 0x2a3148, metalness: 0.7, roughness: 0.4 }), MAXW);
  skirtMesh.receiveShadow = true;
  [wallMesh, capMesh, postMesh, postCap, skirtMesh].forEach(m => { m.count = 0; m.frustumCulled = false; station.add(m); });
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();
  let walls = [], posts = [];
  // 1s: thầy "không dùng màu tường lòe loẹt, chỉ màu trung tính, vừa phải" ⇒ giữ SẮC của bảng màu nhưng hạ độ bão hoà rất thấp, độ sáng vừa
  const _hsl = {};
  const neutral = (hex, sMax, l0, l1) => { const c = new THREE.Color(hex); c.getHSL(_hsl, THREE.SRGBColorSpace); return c.setHSL(_hsl.h, Math.min(_hsl.s, sMax), Math.min(l1, Math.max(l0, _hsl.l)), THREE.SRGBColorSpace); };   // HSL theo sRGB (màu nhìn thấy)
  function applyTheme(th) {
    wallMesh.material.color.copy(neutral(th.wall, 0.16, 0.3, 0.38)); capMesh.material.color.copy(neutral(th.cap, 0.16, 0.38, 0.46)); capMesh.material.emissive.copy(neutral(th.capE, 0.22, 0.3, 0.45));
    capMesh.material.emissiveIntensity = 0.3;
    postMesh.material.color.copy(neutral(th.post, 0.14, 0.24, 0.3)); postCap.material.emissive.copy(neutral(th.postE, 0.25, 0.45, 0.62));
  }
  const wallAnim = { dir: 0, t: 0, ox: 0, oz: 0 };
  let lampPts = [];                                          // 2j: chỗ đèn báo động = chân các cột ở MÉP mê cung (đặt lại mỗi lần dựng map) · cover = cột đã dựng bao nhiêu
  function layoutWalls(grid) {
    walls = []; posts = [];
    const postSet = new Set();
    const addPost = (r, c) => { const k = key(r, c); if (!postSet.has(k)) { postSet.add(k); posts.push({ x: (c - COLS / 2) * CELL, z: (r - ROWS / 2) * CELL }); } };
    const on = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].on;
    const skirts = [];
    for (let r = 0; r <= ROWS; r++) for (let c = 0; c < COLS; c++) {
      const a = on(r - 1, c), b = on(r, c);
      if ((a || b) && !(a && b && grid[r - 1][c].d)) { walls.push({ x: cellX(c), z: (r - ROWS / 2) * CELL, sx: CELL, sz: WALL_T }); addPost(r, c); addPost(r, c + 1); }
      if (a !== b) skirts.push({ x: cellX(c), z: (r - ROWS / 2) * CELL, sx: CELL + WALL_T, sz: WALL_T });
    }
    for (let c = 0; c <= COLS; c++) for (let r = 0; r < ROWS; r++) {
      const a = on(r, c - 1), b = on(r, c);
      if ((a || b) && !(a && b && grid[r][c - 1].r)) { walls.push({ x: (c - COLS / 2) * CELL, z: cellZ(r), sx: WALL_T, sz: CELL }); addPost(r, c); addPost(r + 1, c); }
      if (a !== b) skirts.push({ x: (c - COLS / 2) * CELL, z: cellZ(r), sx: WALL_T, sz: CELL + WALL_T });
    }
    skirts.forEach((k, i) => { _m.compose(_p.set(k.x, -DECK_T, k.z), _q, _s.set(k.sx, DECK_T, k.sz)); skirtMesh.setMatrixAt(i, _m); });
    skirtMesh.count = skirts.length; skirtMesh.instanceMatrix.needsUpdate = true;
    wallMesh.count = capMesh.count = walls.length;
    postMesh.count = postCap.count = posts.length;
    // 2j: cột ở mép vùng có sàn (4 ô quanh cột có ô có sàn lẫn ô không) ⇒ xếp theo góc quanh tâm, lấy đều ~20 cột làm chỗ đèn
    const edge = [];
    postSet.forEach(k => { const [r, c] = k.split(",").map(Number), n = [on(r - 1, c - 1), on(r - 1, c), on(r, c - 1), on(r, c)].filter(Boolean).length;
      if (n && n < 4) edge.push({ x: (c - COLS / 2) * CELL, z: (r - ROWS / 2) * CELL, a: Math.atan2(r - ROWS / 2, c - COLS / 2), cover: 0 }); });
    edge.sort((a, b) => a.a - b.a);
    const step = Math.max(1, edge.length / 20); lampPts = [];
    for (let f = 0; f < edge.length - 0.5 && lampPts.length < 24; f += step) lampPts.push(edge[Math.floor(f)]);
  }
  let wallFront = null;                                     // 1o: intro — {ox, oz, dist}: tường dựng theo mặt sóng lan từ (ox, oz)
  function paintWalls() {
    const maxD = Math.hypot(W, D) / 2 + 1;
    let done = true;
    const kOf = (x, z) => {
      if (wallFront) { const u = clamp((wallFront.dist - Math.hypot(x - wallFront.ox, z - wallFront.oz)) / 5, 0, 1); if (u < 1) done = false; return Math.max(0, easeOutBack(u)); }
      const dl = Math.hypot(x - wallAnim.ox, z - wallAnim.oz) / maxD * 0.55;
      if (wallAnim.dir > 0) { const u = clamp((wallAnim.t - dl) / 0.5, 0, 1); if (u < 1) done = false; return Math.max(0, easeOutBack(u)); }
      const u = clamp((wallAnim.t - dl * 0.5) / 0.35, 0, 1); if (u < 1) done = false; return 1 - u * u;
    };
    walls.forEach((w, i) => {
      const k = kOf(w.x, w.z), h = Math.max(0.001, WALL_H * k);
      _m.compose(_p.set(w.x, 0, w.z), _q, _s.set(w.sx, h, w.sz)); wallMesh.setMatrixAt(i, _m);
      _m.compose(_p.set(w.x, h, w.z), _q, _s.set(w.sx * 0.98, k > 0.02 ? 0.09 : 0.001, w.sz * 1.08)); capMesh.setMatrixAt(i, _m);
    });
    posts.forEach((p, i) => {
      const k = kOf(p.x, p.z), h = Math.max(0.001, (WALL_H + 0.25) * k);
      _m.compose(_p.set(p.x, 0, p.z), _q, _s.set(0.78, h, 0.78)); postMesh.setMatrixAt(i, _m);
      _m.compose(_p.set(p.x, h, p.z), _q, _s.set(0.5, k > 0.02 ? 0.1 : 0.001, 0.5)); postCap.setMatrixAt(i, _m);
    });
    [wallMesh, capMesh, postMesh, postCap].forEach(m => { m.instanceMatrix.needsUpdate = true; });
    lampPts.forEach(L => { L.cover = kOf(L.x, L.z); });   /* 2j: cột dựng tới đâu, đèn dưới chân bị nuốt tới đó */
    return done;
  }

  // ---------------------------------------------------------------- bệ đáp án
  // 1c: bệ phẳng sát sàn (người đứng LÊN được) + máy chiếu giữa bệ + chùm sáng loe lên + BẢNG HOLOGRAM có đáy cao hơn đầu người
  const padGeo = new THREE.CylinderGeometry(1.45, 1.52, 0.07, 40);
  const ringGeo = new THREE.TorusGeometry(1.42, 0.07, 10, 48);
  const SIGN_Y = V.labelY;                                      // đáy bảng (đầu phi hành gia ≈ 4,2)
  const beamGeo = new THREE.CylinderGeometry(1.7, 0.32, SIGN_Y, 40, 1, true).translate(0, SIGN_Y / 2, 0);
  const projGeo = new THREE.CylinderGeometry(0.34, 0.42, 0.16, 20);
  const PAD_COL = { idle: 0xffc53d, ok: 0x4ade80, bad: 0xf87171 };
  let pads = [];
  // 2b: bảng chữ đáp án vẽ sẵn (text → {cv, tex}) — 4 ảnh chữ đưa lên card cùng khung mê cung dựng lên từng làm khựng ~40 ms
  let labelPre = new Map(), labelTok = 0;
  function makeLabelTex(text) {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 200;
    drawLabel(cv, text, "idle");
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return { cv, tex };
  }
  function preLabels(q) {
    labelPre.forEach(v => v.tex.dispose()); labelPre = new Map();
    const tok = ++labelTok, list = (q.answers || []).filter(a => a && a.text != null).map(a => a.text);
    let i = 0; const next = () => { if (tok !== labelTok || i >= list.length) return; const t = list[i++];
      if (!labelPre.has(t)) { const L = makeLabelTex(t); labelPre.set(t, L); try { renderer.initTexture(L.tex); } catch (e) { /* bỏ qua */ } }
      requestAnimationFrame(next); };
    requestAnimationFrame(next);
  }
  function makePad(r, c, text, correct, i) {
    const g = new THREE.Group(); g.position.set(cellX(c), 0, cellZ(r)); station.add(g);
    const base = new THREE.Mesh(padGeo, std({ color: 0x1b2135, metalness: 0.7, roughness: 0.35 })); base.position.y = 0.035; base.receiveShadow = true; g.add(base);
    const ringMat = std({ color: 0x06202e, emissive: PAD_COL.idle, emissiveIntensity: 2.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.075; g.add(ring);
    const proj = new THREE.Mesh(projGeo, ringMat); proj.position.y = 0.1; g.add(proj);
    const beamMat = new THREE.ShaderMaterial({ ...BEAM_SHADER, uniforms: THREE.UniformsUtils.clone(BEAM_SHADER.uniforms), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    beamMat.uniforms.uOpacity.value = 0.22;
    const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.y = 0.1; g.add(beam);
    const pre = labelPre.get(text); if (pre) labelPre.delete(text);   // 2b: bảng chữ đã vẽ + đưa lên card sẵn lúc câu hỏi to đang hiện
    const { cv, tex } = pre || makeLabelTex(text);
    const lw = V.labelW * CELL, lh = lw * 200 / 512;
    const sign = new THREE.Group(); sign.position.y = SIGN_Y; g.add(sign);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh).translate(0, lh / 2, 0),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    lab.renderOrder = 5; sign.add(lab);
    g.scale.setScalar(0.001);
    return { r, c, text, correct, g, ringMat, beamMat, lab, sign, cv, tex, resolved: false, state: "idle", born: i * 0.08, fade: -1, flip: -1, shake: -1 };
  }
  function setPadState(p, st) {
    p.state = st; p.ringMat.emissive.setHex(PAD_COL[st]); p.beamMat.uniforms.uColor.value.setHex(PAD_COL[st]);
    p.beamMat.uniforms.uOpacity.value = st === "idle" ? 0.22 : 0.6;
    drawLabel(p.cv, p.text, st); p.tex.needsUpdate = true;
  }
  function clearPads() {
    pads.forEach(p => { station.remove(p.g); p.tex.dispose(); p.lab.material.dispose(); p.lab.geometry.dispose(); p.ringMat.dispose(); p.beamMat.dispose(); p.g.children[0].material.dispose(); });
    pads = [];
  }

  // ---------------------------------------------------------------- người chơi + địch
  const astro = makeAstronaut(); station.add(astro.g); astro.g.visible = false;
  // 1u: robot đội B — bộ đồ cam để phân biệt với đội A (xám-xanh); mỗi robot có vòng màu đội dưới chân
  const astro2 = makeAstronaut(); station.add(astro2.g); astro2.g.visible = false;
  { const near = (a, b) => Math.abs(a - b) < 0x030303;
    const tint = (m, hex) => { m.color.setHex(hex); m.userData.c0.copy(m.color); };
    astro2.g.traverse(o => { if (!o.isMesh || !o.material.color) return; const m = o.material, h = m.color.getHex();
      if (near(h, 0x8290a6)) tint(m, 0xd9925a); else if (near(h, 0x5f6b82)) tint(m, 0x9a5b34);
      else if (near(h, 0x2563eb)) { tint(m, 0xf97316); m.emissive.setHex(0xc2410c); m.userData.e0.copy(m.emissive); } }); }
  // 1l: điểm mẫu trên thân robot cho đom đóm (mỗi bộ phận nhận số điểm theo diện tích thật × cỡ trên thế giới)
  const buildPts = A => {
    const list = [], v = new THREE.Vector3(), ws = new THREE.Vector3(); A.g.updateMatrixWorld(true);
    A.body.traverse(o => { if (!o.isMesh || o.material.transparent || !o.geometry.attributes.position) return;
      try { const sm = new MeshSurfaceSampler(o).build(), area = sm.distribution ? sm.distribution[sm.distribution.length - 1] : 1; o.getWorldScale(ws); list.push({ o, sm, w: area * ws.x * ws.y }); } catch (e) { /* bỏ qua */ } });
    const tot = list.reduce((a, b) => a + b.w, 0) || 1, out = [];
    for (let i = 0; i < 420; i++) { let r = Math.random() * tot, it = list[0]; for (const L of list) { r -= L.w; if (r <= 0) { it = L; break; } } it.sm.sample(v); out.push([it.o, v.clone()]); }
    return out;
  };
  const ptsOf = new Map([[astro, buildPts(astro)], [astro2, buildPts(astro2)]]);
  function astroBodyPoints(A = astro) {
    const astroPts = ptsOf.get(A); A.g.updateMatrixWorld(true);
    const a = new Float32Array(astroPts.length * 3), v = new THREE.Vector3(), c = [0, 0, 0];
    astroPts.forEach(([o, p], i) => { v.copy(p).applyMatrix4(o.matrixWorld); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; c[0] += v.x; c[1] += v.y; c[2] += v.z; });
    return { pts: a, center: c.map(x => x / astroPts.length) };
  }
  // 1i: vòng nét đứt vàng ở chỗ xuất phát — vật thể riêng, XOAY chậm
  const startRing = new THREE.Group(); station.add(startRing);
  { const cv = document.createElement("canvas"); cv.width = cv.height = 256; const x = cv.getContext("2d");
    x.strokeStyle = "rgba(250,204,21,1)"; x.lineWidth = 11; x.setLineDash([46, 24]); x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2); x.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 1.2, CELL * 1.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.renderOrder = 1; startRing.add(m); }
  const setRed = on => { pl.red = on; astro.setRed(on); };
  // 1t: mặt nắp ô xuất phát (lá cửa đóng) cao ~0,12 so với sàn ⇒ robot đứng trên đó phải nâng lên (không lún); ra mép nắp thì hạ dần về sàn
  const PAD_H = 0.12, PAD_R = CELL * 0.36;
  function padBump(x, z) {
    if (!START) return 0;
    const s0 = spawnOf(0); let d = Math.hypot(x - cellX(s0.c), z - cellZ(s0.r));
    if (fight || ROBOTS > 1) { const [mx, mz] = mateCell(); d = Math.min(d, Math.hypot(x - mx, z - mz)); }   // 1u: nắp ô của robot đội B
    const k = Math.min(1, Math.max(0, (d - PAD_R * 0.7) / (PAD_R * 0.4)));
    return PAD_H * (1 - k * k * (3 - 2 * k));
  }
  const boom = createBoomFX(scene);
  const gates = createGates(station, { R: 1.62, cy: 1.85 });        // 1y: cặp cổng không gian
  const portal = createPortal(renderer); portalObj = portal; portal.setSize(renderer.domElement.width || 2, renderer.domElement.height || 2); fit();
  // 2d: KHỰNG lúc tường dựng + địch trồi (CPU bão hoà): ảnh hầm máy (lớp UNDER, BỘ ĐÈN KHÁC) vẽ NGAY TRƯỚC lượt chính ⇒ three.js thấy "đèn đổi" 2 lần/khung
  //     ⇒ tính lại tham số shader MỌI vật mỗi khung (getParameters/getProgram ~10 % CPU) + cập nhật ma trận cả cảnh 2 lần.
  //     Nay vẽ LỒNG bên trong lượt chính (như Reflector của three): render lồng có trạng thái đèn RIÊNG ⇒ không phá bộ nhớ đệm; bỏ cập nhật ma trận lần 2.
  let portalDue = false;
  const portalHook = new THREE.Mesh(new THREE.PlaneGeometry(0.001, 0.001), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }));
  portalHook.frustumCulled = false; portalHook.renderOrder = -1e6; scene.add(portalHook);
  portalHook.onBeforeRender = (r, sc, cam) => {
    if (!portalDue || cam !== camera) return; portalDue = false;
    const au = scene.matrixWorldAutoUpdate; scene.matrixWorldAutoUpdate = false;
    try { portal.render(scene, camera); } finally { scene.matrixWorldAutoUpdate = au; }
  };
  const hatches = createHatches(station, CELL * 0.36, portal);
  const underdeck = createUnderdeck(scene, { makeRobot: i => makeDrone([0xe53935, 0xa855f7, 0x64748b][i % 3]) });
  // 1m: hình chiếu hộp mê cung trên màn (NDC) ⇒ tàu con nổ ngoài vùng này (không bị trạm che)
  const blockRect = () => {
    camera.updateMatrixWorld(); const v = new THREE.Vector3(), r = { x0: 9, x1: -9, y0: 9, y1: -9 }, W = COLS * CELL / 2 + 2, D = ROWS * CELL / 2 + 2;
    for (const x of [-W, W]) for (const z of [-D, D]) for (const y of [0, 5]) { v.set(x, y, z).project(camera); r.x0 = Math.min(r.x0, v.x); r.x1 = Math.max(r.x1, v.x); r.y0 = Math.min(r.y0, v.y); r.y1 = Math.max(r.y1, v.y); }
    return r;
  };
  const ship = createFleet(scene, camera, { length: 47, dist: 330, cross: 19, renderer, blockRect, onFx: k => sfx.ship(k) });   /* 2j: tiếng súng / trúng / nổ 1/3 */
  const P_DEPTH = 4.9, E_DEPTH = 5.4;                      // độ sâu dưới boong của robot mình / địch khi chờ nâng lên
  let bombs = [], bombsLeft = 0, correctSinceGift = 0;
  // 1e: dựng sẵn vật liệu nổ/xác/bom lúc tải trang (đo: lần nổ đầu khựng 0,28 s vì trình duyệt dịch shader lần đầu)
  { const wb = makeBomb(); wb.g.position.set(0, -60, 0); station.add(wb.g); gates.warm(true);   // 1y: + cổng (dịch sẵn shader xoáy)
    boom.explode(0, 0, 0.2); boom.wreck(0, 0, 0xe53935); boom.wreck(0, 0, 0, "astro"); boom.rubble(0, 0, 1, 1, 0x1745c8, 0x1f5fff); boom.fireflies(0, 0); boom.update(0.016);   // 1h: + xác robot mình + gạch tường · 1j: + đom đóm
    for (let k = 0; k < 5; k++) hatches.run(k * 5, 0, { mode: "rise" }); hatches.update(0.3, 0);   // 5 nắp dựng sẵn vào kho
    // 2b: KHỰNG intro giây 5,2 (477 ms khi đo từng khung) = shader cổng + cột sáng bệ bị dịch LẠI giữa intro: compile() cũ chạy khi đích vẽ là
    //     MÀN HÌNH (sRGB) còn game luôn vẽ vào khung hậu kỳ (sRGB tuyến tính) ⇒ khác khoá chương trình ⇒ phải dịch lại. Nay đặt đúng đích vẽ.
    try { renderer.setRenderTarget(composer.renderTarget1); renderer.compile(scene, camera); renderer.setRenderTarget(null); composer.render(); } catch (e) { renderer.setRenderTarget(null); }
    boom.clear(); station.remove(wb.g); hatches.clear(); gates.warm(false); }
  const pLight = new THREE.PointLight(0x7dd3fc, 0, 12, 2); pLight.position.y = -50; station.add(pLight);   // 1j: KHÔNG gắn vào robot — robot ẩn/hiện làm SỐ ĐÈN đổi ⇒ trình duyệt dịch lại shader mọi vật (khựng 0,4–0,6 s)
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.ShaderMaterial({ ...ATMO_SHADER, uniforms: { uColor: { value: new THREE.Color(0x7dd3fc) } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  shield.position.y = 1.3; shield.visible = false; astro.g.add(shield);
  const shield2 = shield.clone(); shield2.material = shield.material.clone(); shield2.material.uniforms = { uColor: { value: new THREE.Color(0xfb923c) } };   // 1u: hào quang đội B (cam)
  shield2.visible = false; astro2.g.add(shield2);
  const rings = [astro, astro2].map((A, i) => {   // 1u: vòng màu đội dưới chân (chỉ hiện ở Fight)
    const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.86, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TEAM_META[i].hex, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
    m.position.y = 0.06; m.renderOrder = 3; m.visible = false; A.g.add(m); return m; });
  const tpBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 32, 1, true).translate(0, 6, 0),
    new THREE.ShaderMaterial({ ...BEAM_SHADER, uniforms: THREE.UniformsUtils.clone(BEAM_SHADER.uniforms), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  tpBeam.visible = false; station.add(tpBeam);
  const drones = [0xe53935, 0xa855f7, 0xe53935, 0xa855f7].map(c => { const d = makeDrone(c); d.color = c; d.g.visible = false; station.add(d.g); return d; });
  // 1j: robot (mình + địch) cũng hiện trong ảnh "nhìn xuống hầm" ⇒ thấy nó đứng trên bệ nâng dưới giếng
  [astro.g, astro2.g, ...drones.map(d => d.g)].forEach(o => o.traverse(m => m.layers.enable(UNDER)));

  // ---------------------------------------------------------------- hạt
  const NP = 900;
  const pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pVel = new Float32Array(NP * 3), pBase = new Float32Array(NP * 3), pLife = new Float32Array(NP), pMax = new Float32Array(NP);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.55, vertexColors: true, map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  parts.frustumCulled = false; parts.renderOrder = 6; scene.add(parts);
  let pNext = 0;
  function burst(x, y, z, hex, n, spd = 7, up = 4, life = 0.9) {
    const c = new THREE.Color(hex);
    for (let k = 0; k < n; k++) {
      const i = pNext; pNext = (pNext + 1) % NP;
      pPos.set([x, y, z], i * 3);
      const v = new THREE.Vector3().randomDirection().multiplyScalar(spd * (0.3 + Math.random() * 0.7));
      pVel.set([v.x, Math.abs(v.y) * 0.6 + up * Math.random(), v.z], i * 3);
      pBase.set([c.r, c.g, c.b], i * 3);
      pMax[i] = pLife[i] = life * (0.6 + Math.random() * 0.6);
    }
  }
  function updateParts(dt) {
    for (let i = 0; i < NP; i++) {
      if (pLife[i] <= 0) { pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0; continue; }
      pLife[i] -= dt;
      const k = Math.max(0, pLife[i] / pMax[i]);
      pVel[i * 3 + 1] -= 6 * dt;
      for (let a = 0; a < 3; a++) { pVel[i * 3 + a] *= 1 - 1.4 * dt; pPos[i * 3 + a] += pVel[i * 3 + a] * dt; pCol[i * 3 + a] = pBase[i * 3 + a] * k * 2; }
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  // ---------------------------------------------------------------- máy quay
  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), blend: 0, yaw: Math.PI, trauma: 0 };
  function fixedPose(dirArr, fov) {
    camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    const dir = new THREE.Vector3(...dirArr).normalize();
    const pts = [];
    for (const x of [-W / 2 - 0.8, W / 2 + 0.8]) for (const z of [-D / 2 - 0.8, D / 2 + 0.8]) for (const y of [0, WALL_H + 0.3]) pts.push(new THREE.Vector3(x, y, z));
    const top = 1 - 2 * 0.12, bot = -1 + 2 * 0.08,   /* 2b: đơn = cùng lề trên/dưới như Fight (đồng hồ LED ở dưới) */ side = 1 - 2 * FIGHT_SIDE;   // 1w: Fight — mép mê cung cách D-pad đúng bằng D-pad cách mép màn   // 1v: Fight chừa 2 bên cho D-pad, dưới cho đồng hồ
    const target = new THREE.Vector3(); let dist = 80;
    if (!fight) {                                         // 2b: chế độ ĐƠN — D-pad nằm giữa mép TRÁI như đội A của Fight, bên phải trống ⇒ mê cung lệch phải, lấn sát mép phải cho to
      const xd = -(1 - 2 * FIGHT_SIDE), xr = 1 - 2 * 0.018, xb = -1 + 2 * 0.012, e = W / 2 + WALL_T / 2;
      const a = new THREE.Vector3(), b = new THREE.Vector3();
      const right = new THREE.Vector3(), up = new THREE.Vector3();
      for (let it = 0; it < 60; it++) {
        camera.position.copy(target).addScaledVector(dir, dist); camera.lookAt(target); camera.updateMatrixWorld();
        let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
        for (const p of pts) { const v = p.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
        a.set(-e, WALL_H, -D / 2 - WALL_T / 2).project(camera); b.set(-e, WALL_H, D / 2 + WALL_T / 2).project(camera);
        const xL = a.x + (b.x - a.x) * (0 - a.y) / ((b.y - a.y) || 1e-6);   // mép trái mê cung ở ngang tâm D-pad (NDC y = 0)
        const sc = Math.max((x1 - xL) / (xr - xd), (x1 - x0) / (xr - xb), (y1 - y0) / (top - bot));
        dist *= Math.pow(sc, 0.8);
        const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
        right.set(1, 0, 0).applyQuaternion(camera.quaternion); up.set(0, 1, 0).applyQuaternion(camera.quaternion);
        const lo = Math.max(xd - xL, xb - x0), hi = xr - x1;           // đẩy ngang cho vừa khe [D-pad, mép phải]
        target.addScaledVector(right, -(lo + hi) / 2 * dist * t * aspect * 0.9);   // dời cảnh sang ngang (lo + hi) / 2 = giữa khoảng dời hợp lệ
        target.addScaledVector(up, ((y0 + y1) / 2 - (top + bot) / 2) * dist * t * 0.9);
      }
      return { pos: camera.position.clone(), look: target.clone() };
    }
    for (let it = 0; it < 40; it++) {
      camera.position.copy(target).addScaledVector(dir, dist); camera.lookAt(target); camera.updateMatrixWorld();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const p of pts) { const v = p.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const sc = Math.max((x1 - x0) / (2 * side), (y1 - y0) / (top - bot));
      dist *= Math.pow(sc, 0.85);
      const dy = (y0 + y1) / 2 - (top + bot) / 2, up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      target.addScaledVector(up, dy * dist * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 0.9);
    }
    if (fight) {                                          // 1w: căn theo MÉP TRÁI mê cung (đỉnh tường) ở ĐÚNG ngang tầm tâm D-pad (NDC y = 0)
      const xd = -(1 - 2 * FIGHT_SIDE), e = W / 2 + WALL_T / 2, a = new THREE.Vector3(), b = new THREE.Vector3();
      for (let it = 0; it < 30; it++) {
        camera.position.copy(target).addScaledVector(dir, dist); camera.lookAt(target); camera.updateMatrixWorld();
        a.set(-e, WALL_H, -D / 2 - WALL_T / 2).project(camera); b.set(-e, WALL_H, D / 2 + WALL_T / 2).project(camera);
        const xL = a.x + (b.x - a.x) * (0 - a.y) / ((b.y - a.y) || 1e-6);
        const lo = new THREE.Vector3(-e, 0, D / 2 + WALL_T / 2).project(camera).y;       // đáy mê cung không lấn đồng hồ (≥ 7 % từ đáy)
        let k = xL / xd; if (lo < -1 + 2 * 0.07 && k < 1) k = 1.01;
        dist *= Math.pow(k, 0.9);
      }
    }
    return { pos: camera.position.clone(), look: target.clone() };
  }
  // 1w: D-pad Fight rộng 9cqw, cách mép 1,9cqw ⇒ mép mê cung ở 1,9 + 9 + 1,9 = 12,8 % bề ngang (hộp tính có lề 0,8 đv quanh tường)
  const FIGHT_SIDE = (1.9 + 9 + 1.9) / 100;
  let overview = null;
  function relayout() {                                     // 1v: đổi cửa sổ / đổi chế độ ⇒ tính lại khung + góc máy toàn cảnh
    mount.classList.toggle("is-fightgame", fight); stage.classList.toggle("is-fight", fight);
    clockEl.classList.add("led"); clockEl._v = null;   // 2b: đơn cũng dùng đồng hồ LED như Fight   // 1v: đồng hồ LED cần lớp .led mới sáng đúng thanh (không thì hiện "8:88")
    fit(); overview = fixedPose(V.kind === "chase" ? V.overview : V.dir, V.kind === "chase" ? 32 : V.fov);
    camera.fov = V.fov; camera.updateProjectionMatrix();
  }
  relayout();
  function setFightMode(v) { opt.fight = !!v; if (fight === !!v) return; fight = !!v; relayout(); teams.forEach(T => { if (T.el) T.el.hidden = true; if (T.bar) T.bar.hidden = true; }); applyDpad(); }
  function chasePose() {
    const p = astro.g.position, f = new THREE.Vector3(Math.sin(cam.yaw), 0, Math.cos(cam.yaw));
    return { pos: new THREE.Vector3(p.x - f.x * V.back, V.height, p.z - f.z * V.back), look: new THREE.Vector3(p.x + f.x * V.ahead, 0.4, p.z + f.z * V.ahead) };
  }
  let camOverride = null;   // bàn thử: __mc.cam([x,y,z],[x,y,z]) soi gần; __mc.cam() trả lại
  let cineCam = null;       // 1o: intro đặt máy quay mỗi khung {pos, look, fov, roll}
  function updateCamera(dt) {
    if (cineCam && !camOverride) {
      cam.trauma = Math.max(0, cam.trauma - dt * 1.8);
      const s = cam.trauma * cam.trauma * 0.9;
      camera.position.copy(cineCam.pos).add(new THREE.Vector3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
      if (Math.abs(camera.fov - cineCam.fov) > 0.01) { camera.fov = cineCam.fov; camera.updateProjectionMatrix(); }
      camera.up.set(0, 1, 0); camera.lookAt(cineCam.look); if (cineCam.roll) camera.rotateZ(cineCam.roll);
      return;
    }
    let pos = overview.pos, look = overview.look, fov = V.fov;
    if (camOverride) { pos = camOverride.pos; look = camOverride.look; }
    if (V.kind === "chase") {
      const want = (phase === "play" || phase === "hold") ? 1 : 0;
      cam.blend += (want - cam.blend) * Math.min(1, dt * (want ? 1.9 : 2.6));
      const tgtYaw = pl.heading;
      let dy = tgtYaw - cam.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      cam.yaw += dy * Math.min(1, dt * 3.4);
      const cp = chasePose(), b = ease(clamp(cam.blend, 0, 1));
      pos = overview.pos.clone().lerp(cp.pos, b); look = overview.look.clone().lerp(cp.look, b);
      fov = THREE.MathUtils.lerp(32, V.fov, b);
    }
    cam.trauma = Math.max(0, cam.trauma - dt * 1.8);
    const s = cam.trauma * cam.trauma * 0.6;
    camera.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.lookAt(look);
  }

  // ---------------------------------------------------------------- trạng thái ván
  let phase = "menu", paused = false, gameT = 0, playT = 0, jobs = [];
  let grid = null, order = [], qi = 0, results = [], lives = 5, score = 0, enemyCount = 2, enemySpeed = 3, graceUntil = 0, invulnUntil = 0;
  let firstQ = true, autoplay = false, stepN = 0, autoTo = null;
  let START = { r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) }, espots = [[0, 0], [ROWS - 1, COLS - 1], [0, COLS - 1], [ROWS - 1, 0]];
  let nextMap = makeDeck(), curMap = null, logo = null;
  // 1e: sân xuất phát (tới 5×3) quanh ô xuất phát — mở hết vách giữa các ô có sàn; hàng NGAY DƯỚI chỗ xuất phát (gần máy quay)
  // khắc ANDREW STUDIO, rộng tới 5 ô (ít nhất 3) ⇒ chữ to, không bị người đứng che
  function openPlaza() {
    const onC = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].on;
    const { r: sr, c: sc } = START;
    for (let r = sr - 1; r <= sr + 1; r++) for (let c = sc - 1; c <= sc + 1; c++) {   // 1t: sân 3×3 (cũ 3×5) — bớt khoảng trống
      if (!onC(r, c)) continue;
      grid[r][c].plaza = true;                               // không đặt bệ đáp án trong sân (khỏi đè chữ)
      if (c < sc + 1 && onC(r, c + 1)) { grid[r][c].r = true; grid[r][c + 1].l = true; }
      if (r < sr + 1 && onC(r + 1, c)) { grid[r][c].d = true; grid[r + 1][c].u = true; }
    }
    for (const r of [sr + 1, sr - 1]) {
      if (!(onC(r, sc - 1) && onC(r, sc) && onC(r, sc + 1))) continue;
      const lg = { r, c0: sc - 1, c1: sc + 1 };                // 1t: chữ sàn gọn trong 3 ô
      // bảng hologram treo cao ⇒ trên màn bị đẩy LÊN ~1 ô: bệ ở hàng ngay dưới chữ sẽ che chữ ⇒ cấm đặt bệ ở đó
      for (let c = lg.c0 - 1; c <= lg.c1 + 1; c++) if (onC(r + 1, c)) grid[r + 1][c].plaza = true;
      // 1f: vách NGAY TRƯỚC dòng chữ (phía máy quay) che mất dòng STUDIO ⇒ mở vách đó + nối các ô hàng dưới với nhau
      if (r > sr) for (let c = lg.c0; c <= lg.c1; c++) if (onC(r + 1, c)) {
        grid[r][c].d = true; grid[r + 1][c].u = true;
        if (c < lg.c1 && onC(r + 1, c + 1)) { grid[r + 1][c].r = true; grid[r + 1][c + 1].l = true; }
      }
      return lg;
    }
    return null;
  }
  // ================= 1x: FIGHT CÔNG BẰNG
  // Ô xuất phát: xa nhau nhất (quãng đi thật BFS), cách góc địch ≥ 4 bước, ngoài sân chữ; trong các cặp ≥ 90 % xa nhất chọn cặp mà khoảng
  // cách tới TỪNG góc địch của 2 ô gần bằng nhau nhất (đối xứng), tránh lặp cặp câu trước. Đội A (D-pad trái) nhận ô bên trái màn.
  let SPAWN = [null, null], lastSpawnKey = "";
  const spawnOf = i => (fight && SPAWN[i]) || (i ? mateRC0() : START);
  function chooseSpawns() {
    const eD = espots.map(([r, c]) => pathDist(grid, r, c)), cand = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const g = grid[r][c]; if (!g.on || g.plaza) continue;
      if (eD.some((d, i) => d[r][c] < 4 || Math.abs(r - espots[i][0]) + Math.abs(c - espots[i][1]) < 4)) continue;
      cand.push({ r, c, d: pathDist(grid, r, c) });
    }
    if (cand.length < 2) { SPAWN = [START, mateRC0()]; return; }
    const pairs = []; let maxD = 0;
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) { const d = cand[i].d[cand[j].r][cand[j].c]; if (d > 0) { pairs.push([cand[i], cand[j], d]); if (d > maxD) maxD = d; } }
    const far = pairs.filter(p => p[2] >= maxD * 0.9).map(([a, b, d]) => ({ a, b, d, f: eD.reduce((t, e) => t + Math.abs(e[a.r][a.c] - e[b.r][b.c]), 0) + Math.random() * 1.5 }));
    far.sort((x, y) => x.f - y.f);
    const key = p => [p.a.r, p.a.c, p.b.r, p.b.c].join(",");
    const pick = far.find(p => key(p) !== lastSpawnKey) || far[0];
    lastSpawnKey = key(pick);
    let [A, B] = [pick.a, pick.b]; if (B.c < A.c || (B.c === A.c && B.r > A.r)) [A, B] = [B, A];
    SPAWN = [{ r: A.r, c: A.c }, { r: B.r, c: B.c }];
  }
  // Bệ đúng: |quãng A − quãng B| nhỏ nhất + ÁP LỰC ĐỊCH lên đường đi của 2 đội bằng nhau (chọn luôn bộ góc địch cho câu này).
  // Áp lực 1 địch lên 1 đội = e^(−biên/1,5), biên = min trên đường ngắn nhất (giây địch tới ô đó − giây robot tới ô đó).
  function pickFightSpots(answers) {
    const [a, b] = SPAWN, dA = pathDist(grid, a.r, a.c), dB = pathDist(grid, b.r, b.c), span = Math.max(4, dA[b.r][b.c]);
    const eD = espots.map(([r, c]) => pathDist(grid, r, c));
    const k = Math.min(enemyCount, espots.length), subsets = [];
    (function sub(st, acc) { if (acc.length === k) { subsets.push(acc.slice()); return; } for (let i = st; i < espots.length; i++) { acc.push(i); sub(i + 1, acc); acc.pop(); } })(0, []);
    const pathTo = (dFrom, tr, tc) => {                       // đường ngắn nhất (ô) từ robot tới bệ, đi ngược theo bậc giảm
      const dT = pathDist(grid, tr, tc), out = []; let r = tr, c = tc;
      for (let n = 0; n < 200; n++) { out.push([r, c]); if (dFrom[r][c] === 0) break; const k2 = DK.find(k3 => grid[r][c][k3] && dFrom[r + DIRS[k3].dr][c + DIRS[k3].dc] === dFrom[r][c] - 1); if (!k2) break; r += DIRS[k2].dr; c += DIRS[k2].dc; }
      return out; };
    const press = (dX, path, set) => set.reduce((t, ei) => { let m = 1e9; for (const [r, c] of path) m = Math.min(m, eD[ei][r][c] / enemySpeed - dX[r][c] / PLAYER_SPEED); return t + Math.exp(-Math.max(0, m) / 1.5); }, 0);
    const near = (r, c) => espots.some(([er, ec]) => Math.abs(r - er) + Math.abs(c - ec) < 3) || (r === a.r && c === a.c) || (r === b.r && c === b.c);
    const best = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const g = grid[r][c]; if (!g.on || g.plaza || near(r, c)) continue;
      const x = dA[r][c], y = dB[r][c]; if (x < 4 || y < 4) continue;
      const pA = pathTo(dA, r, c), pB = pathTo(dB, r, c);
      for (const set of subsets) {
        const J = 2 * Math.abs(x - y) + 3 * Math.abs(press(dA, pA, set) - press(dB, pB, set)) + 0.12 * Math.abs((x + y) / 2 - span * 0.6);
        best.push({ r, c, set, J, x, y });
      }
    }
    best.sort((p, q) => p.J - q.J);
    const top = best.slice(0, 6), win = top.length ? top[randi(top.length)] : null;
    const spots = []; const used = [];
    if (win) { used.push([win.r, win.c]); const rest = espots.filter((_, i) => !win.set.includes(i)); espots = [...win.set.map(i => espots[i]), ...rest]; }
    fightFair = win ? { dA: win.x, dB: win.y, J: +win.J.toFixed(2) } : null;
    // bệ sai: cũng ở tầm tương đương (|quãng A − quãng B| ≤ 2), không sát ô xuất phát, không sát bệ khác
    const wrongC = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const g = grid[r][c]; if (!g.on || g.plaza || near(r, c) || dA[r][c] < 3 || dB[r][c] < 3) continue; wrongC.push([r, c, Math.abs(dA[r][c] - dB[r][c])]); }
    shuffle(wrongC); wrongC.sort((p, q) => Math.min(p[2], 3) - Math.min(q[2], 3));
    const takeWrong = () => { for (const minSep of [4, 3, 2, 1]) { const w = wrongC.find(([r, c]) => used.every(([ur, uc]) => Math.abs(ur - r) + Math.abs(uc - c) >= minSep)); if (w) { used.push([w[0], w[1]]); return [w[0], w[1]]; } } return [a.r, a.c]; };
    answers.forEach(ans => spots.push(ans.correct && win ? [win.r, win.c] : takeWrong()));
    return spots;
  }
  let fightFair = null;
  // ================= 1y: CỔNG KHÔNG GIAN — tính chỗ đặt mỗi câu
  const GATE_CD = 3;   /* 2k: = lúc cổng tắt */ let gateBackAt = 0;                                          // giây hồi của mỗi robot sau khi đi qua cổng
  let gatePair = null, gateTok = 0;                                        // [{r,c}, {r,c}] hoặc null (câu không đặt được)
  const gateAt = (r, c) => gatePair ? gatePair.findIndex(g => g.r === r && g.c === c) : -1;
  function reachN(r0, c0, n) {                                // số ô tới được trong n bước = độ "thoáng"
    const seen = new Set([r0 + "," + c0]); let fr = [[r0, c0]];
    for (let k = 0; k < n; k++) { const nx = []; for (const [r, c] of fr) for (const d of DK) if (grid[r][c][d]) { const q = (r + DIRS[d].dr) + "," + (c + DIRS[d].dc); if (!seen.has(q)) { seen.add(q); nx.push([r + DIRS[d].dr, c + DIRS[d].dc]); } } fr = nx; }
    return seen.size;
  }
  function placeGates() {
    gatePair = null; gates.clear();
    const cp = pads.find(p => p.correct); if (!cp || !grid) return;
    const srcs = fight && SPAWN[0] ? SPAWN : [START];
    const dC = pathDist(grid, cp.r, cp.c), dSrc = srcs.map(s0 => pathDist(grid, s0.r, s0.c));
    const deg = (r, c) => DK.filter(d => grid[r][c][d]).length;
    const bad = (r, c) => { const g = grid[r][c]; if (!g.on || g.plaza) return true;
      if (pads.some(p => Math.abs(p.r - r) + Math.abs(p.c - c) < 2)) return true;
      if (srcs.some(s0 => Math.abs(s0.r - r) + Math.abs(s0.c - c) < 3) || (Math.abs(START.r - r) + Math.abs(START.c - c) < 2)) return true;
      if (espots.some(([er, ec]) => Math.abs(er - r) + Math.abs(ec - c) < 3)) return true;
      return false; };
    const cells = [];
    const wallSide = (r, c) => { const g = grid[r][c], sides = ["u", "l", "r"].filter(d => !g[d]); if (!sides.length) return null;   // 2b: vách kín để dán cổng
      return sides.includes("u") && Math.random() < 0.7 ? "u" : sides[randi(sides.length)]; };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!bad(r, c)) { const side = wallSide(r, c); if (!side) continue; const n3 = reachN(r, c, 3); cells.push({ r, c, side, n3, hard: 14 / n3 + (deg(r, c) === 1 ? 1.4 : deg(r, c) === 2 ? 0.4 : 0) + Math.random() * 0.25 }); }
    if (cells.length < 2) return;
    const hardList = cells.slice().sort((a, b) => b.hard - a.hard).slice(0, 10);
    const cand = [];
    for (const g1 of hardList) {
      const d1 = pathDist(grid, g1.r, g1.c); let far = 0; cells.forEach(o => { far = Math.max(far, d1[o.r][o.c]); });
      for (const g2 of cells) {
        if (g2 === g1) continue; const dd = d1[g2.r][g2.c]; if (dd < Math.max(6, far * 0.55)) continue;
        // không làm tắt tới bệ đúng: từng nguồn (ô xuất phát / mỗi đội) có cổng vẫn ≥ 70 % quãng cũ
        let ok = true; const dW = [];
        dSrc.forEach(dS => { const base = dS[cp.r][cp.c]; const w = Math.min(base, dS[g1.r][g1.c] + 1 + dC[g2.r][g2.c], dS[g2.r][g2.c] + 1 + dC[g1.r][g1.c]); dW.push({ base, w }); if (w < base * 0.7) ok = false; });
        if (!ok) continue;
        let fair = 0;
        if (dSrc.length > 1) {                                     // Fight: không phá công bằng + tới cổng gần mình tương đương
          const [a, b] = dW; if (Math.abs(a.w - b.w) > Math.abs(a.base - b.base) + 1) continue;
          const nA = Math.min(dSrc[0][g1.r][g1.c], dSrc[0][g2.r][g2.c]), nB = Math.min(dSrc[1][g1.r][g1.c], dSrc[1][g2.r][g2.c]);
          if (Math.abs(nA - nB) > 3) continue; fair = Math.abs(nA - nB);
        }
        cand.push({ g1, g2, score: g1.hard * 2 + g2.n3 * 0.12 + dd * 0.05 - fair * 0.6 });
      }
    }
    if (!cand.length) return;
    cand.sort((x, y) => y.score - x.score);
    const w = cand[randi(Math.min(3, cand.length))];
    gatePair = [{ r: w.g1.r, c: w.g1.c, d: w.g1.side }, { r: w.g2.r, c: w.g2.c, d: w.g2.side }];
    // 2b: cổng DÁN PHẲNG lên mặt vách của ô (không đứng giữa lối đi), mặt xoáy quay vào trong ô
    gates.place(...gatePair.map(g => { const [fx, fz] = gateFace(g, 0.04); return { x: fx, z: fz, yaw: Math.atan2(-DIRS[g.d].dc, -DIRS[g.d].dr), tilt: 0 }; }));
    [0, 1].forEach(i => gates.setReady(i, [true, true], fight));
  }
  // 2b: điểm trên MẶT vách có cổng của ô g (lùi vào trong ô một chút `off`)
  function gateFace(g, off = 0) { const k = CELL / 2 - WALL_T / 2 - off; return [cellX(g.c) + DIRS[g.d].dc * k, cellZ(g.r) + DIRS[g.d].dr * k]; }
  const WARP_IN = 0.26, WARP_OUT = 0.34;
  // 2b: cổng nằm trên VÁCH — robot đứng ở ô cổng mà đi/bấm hướng VÀO vách đó ⇒ bị hút; đi dọc qua trước cổng thì không sao
  function tryGate(T, d) {
    const p = T.pl, i = gateAt(p.r, p.c);
    if (i < 0 || !d || gatePair[i].d !== d || p.warp || gameT < (p.gateCd || 0) || !gates.usable) return false;   // 1z: cổng phải đã mở hẳn
    const to = gatePair[1 - i];
    p.warp = { t: 0, from: i, to, moved: false, a: entityPos(p) }; p.moving = false; p.queued = null; p.dir = null;
    p.heading = Math.atan2(DIRS[d].dc, DIRS[d].dr);
    gates.pulse(i); sfx.gateIn(); { const [fx, fz] = gateFace(gatePair[i], 0.3); burst(fx, 1.6, fz, 0xc084fc, 40, 5, 3, 0.6); }
    return true;
  }
  function tickWarp(T, dt) {
    const p = T.pl; if (!p.warp) return;
    const w = p.warp; w.t += dt;
    const ease3 = k => k * k * (3 - 2 * k);
    if (!w.moved) {                                           // bị hút: trượt từ giữa ô vào mặt vách
      const [fx, fz] = gateFace(gatePair[w.from], 0.35), k = ease3(Math.min(1, w.t / WARP_IN));
      p.hold = [w.a[0] + (fx - w.a[0]) * k, w.a[1] + (fz - w.a[1]) * k];
      if (w.t >= WARP_IN) {
        w.moved = true; Object.assign(p, { r: w.to.r, c: w.to.c, nr: w.to.r, nc: w.to.c, t: 0, moving: false });
        p.heading = Math.atan2(DIRS[DIRS[w.to.d].opp].dc, DIRS[DIRS[w.to.d].opp].dr);   // quay lưng lại vách cổng ra
        gates.pulse(1 - w.from); { const [fx2, fz2] = gateFace(w.to, 0.3); burst(fx2, 1.6, fz2, 0xc084fc, 40, 5, 3, 0.6); }
      }
    }
    if (w.moved) {                                            // nhả ra: từ mặt vách cổng kia bước ra giữa ô, đứng chờ lệnh
      const [fx, fz] = gateFace(w.to, 0.35), k = ease3(Math.min(1, (w.t - WARP_IN) / WARP_OUT)), cx = cellX(w.to.c), cz = cellZ(w.to.r);
      p.hold = [fx + (cx - fx) * k, fz + (cz - fz) * k];
    }
    if (w.t >= WARP_IN + WARP_OUT) { p.warp = null; p.hold = null; p.gateCd = gameT + GATE_CD; T.astro.g.scale.setScalar(1.75); T.astro.body.rotation.y = 0; gatesAway(); }
  }
  // 2k: robot vừa ra khỏi cổng bên kia ⇒ cặp cổng TẮT (thu nhỏ biến mất) 3 s rồi hiện lại — người chơi thấy rõ là đang không chui được
  function gatesAway() {
    if (!gatePair) return;
    const tok = gateTok; gateBackAt = gameT + GATE_CD;
    gates.close(); sfx.gateClose();
    later(GATE_CD, () => {
      if (tok !== gateTok || !gatePair || gameT < gateBackAt - 0.01 || (phase !== "play" && phase !== "swap")) return;
      gates.open(); sfx.gateOpen(); gatePair.forEach(g => { const [fx, fz] = gateFace(g, 0.3); burst(fx, 1.6, fz, 0xc084fc, 40, 5, 3, 0.6); });
    });
  }
  function paintGateReady() {
    if (!gatePair) return;
    const rs = teams.map(T => !T.pl.warp && gameT >= (T.pl.gateCd || 0));
    [0, 1].forEach(i => gates.setReady(i, fight ? rs : [rs[0], rs[0]], fight));
  }
  // 2f: ĐÈN BÁO ĐỘNG — đèn đỏ quanh mép trạm (chóp đỏ + quầng) nhấp nháy xen kẽ, kèm viền màn đỏ đập nhịp (CSS .mc-alarm); không thêm đèn chiếu sáng
  // 2j: đèn NẰM TRÊN BOONG ngay chỗ chân cột mép (lampPts), nhỏ hơn cột (0,78) ⇒ cột dựng lên là bọc kín đèn; quầng sáng tắt dần theo cột
  const alarm = { g: new THREE.Group(), lamps: [], k: 0, want: 0 };
  { alarm.g.visible = false; station.add(alarm.g);
    const domeGeo = new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), baseGeo = new THREE.CylinderGeometry(0.3, 0.34, 0.12, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.7, roughness: 0.4 });
    const tex = glowTex("rgba(255,70,50,1)", "rgba(255,0,0,0)");
    const put = ph => { const l = new THREE.Group(); l.visible = false; alarm.g.add(l);
      const base = new THREE.Mesh(baseGeo, baseMat); base.position.y = 0.06; l.add(base);
      const dm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.25, 0.15), toneMapped: false }); const dome = new THREE.Mesh(domeGeo, dm); dome.position.y = 0.12; l.add(dome);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(2.2, 0.35, 0.25), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      sp.position.y = 0.3; sp.scale.setScalar(3.6); l.add(sp); alarm.lamps.push({ l, dm, sp, ph }); };
    for (let i = 0; i < 24; i++) put(i % 2); }
  function placeLamps() { alarm.lamps.forEach((L, i) => { const P = lampPts[i]; L.l.visible = !!P; if (P) L.l.position.set(P.x, 0.002, P.z); }); }   // 2j
  const alarmCss = mount.querySelector(".mc-alarm");
  function setAlarm(on) { sfx.alarm?.(!!on); /* 2i: còi báo động theo đèn */ alarm.want = on ? 1 : 0; if (on) { placeLamps(); alarm.g.visible = true; } alarmCss && alarmCss.classList.toggle("on", !!on); }
  function tickAlarm(dt) {
    alarm.k += ((alarm.want) - alarm.k) * Math.min(1, dt * (alarm.want ? 8 : 3));
    if (alarm.k < 0.01 && !alarm.want) { alarm.g.visible = false; if (alarmCss) alarmCss.style.opacity = 0; return; }
    const t = gameT * 3.2;
    const b = Math.pow(Math.max(0, Math.sin(t * Math.PI)), 3) * alarm.k;   /* 2h: MỌI đèn cùng một nhịp (2f: xen kẽ) */
    alarm.lamps.forEach((L, i) => { const P = lampPts[i]; if (!P) return; const u = 1 - clamp(P.cover / 0.9, 0, 1);   /* 2j: cột bọc tới đâu tắt tới đó */
      L.l.visible = u > 0.01; L.dm.color.setRGB(0.35 + 2.8 * b, 0.05 + 0.2 * b, 0.04 + 0.12 * b); L.sp.material.opacity = b * u * u; });
    if (alarmCss) alarmCss.style.opacity = (0.12 * alarm.k + 0.88 * b).toFixed(3);   /* 2h: viền màn đỏ sáng cùng lúc với đèn */
  }
  let floorTok = 0, deckJob = null;
  // 2p: sàn vẽ chia khung xong ⇒ đưa lên card MỖI KHUNG MỘT ẢNH, đặt needsUpdate ngay trước khi tải (đặt cả 4 cùng lúc thì lượt vẽ kế tiếp tự tải cả 4 ⇒ vẫn dồn một khung)
  function uploadDeckLazy() {
    const q = [floorTex, floorNrm, floorRgh, floorEmi], tok = ++floorTok;
    const up = () => { if (dead || tok !== floorTok || !q.length) return; const t = q.shift(); t.needsUpdate = true; try { renderer.initTexture(t); } catch (e) { /* bỏ qua */ } requestAnimationFrame(up); };
    requestAnimationFrame(up);
  }
  function stepDeck() { if (deckJob && deckJob.step(4)) { deckJob = null; uploadDeckLazy(); } }   // mỗi khung (frame)
  function finishDeck() { if (!deckJob) return; deckJob.finish(); deckJob = null; ++floorTok; [floorTex, floorNrm, floorRgh, floorEmi].forEach(t => { t.needsUpdate = true; }); }   // phải xong NGAY (dựng mê cung)
  function useMap(m, lazy = false) {        // dựng một map: lưới + sàn + màu + vách mép · 2p: lazy ⇒ sàn vẽ chia khung (sang câu)
    curMapSrc = m; curMap = genMap(m); grid = curMap.grid; START = curMap.start; espots = curMap.enemySpots;
    logo = openPlaza();
    if (deckJob) { deckJob.cancel(); deckJob = null; }
    applyTheme(curMap.theme);
    if (lazy) deckJob = deck.paintLazy(grid, curMap.theme, null, logo); else deck.paint(grid, curMap.theme, null, logo);
    startRing.position.set(cellX(START.c), 0.035, cellZ(START.r)); startRing.visible = false;
    placeWings();                                                    // 1x: thanh giằng pin chạm đúng mép map này
    SPAWN = [null, null]; if (fight) chooseSpawns();                  // 1x: Fight — 2 ô xuất phát xa nhau, cân bằng
    { const pads0 = [[cellX(spawnOf(0).c), cellZ(spawnOf(0).r)]];      // 1s: ô tròn cố định (thay vòng vàng nét đứt)
      if (fight || +(new URLSearchParams(location.search).get("robots") || 1) > 1) { const b = spawnOf(1); pads0.push([cellX(b.c), cellZ(b.r)]); }
      hatches.fixtures(pads0); }
    if (lazy) { layoutWalls(grid); return; }   // 2p: sàn tự tải lên card khi vẽ xong (stepDeck)
    [floorTex, floorNrm, floorRgh, floorEmi].forEach(t => { t.needsUpdate = true; });
    // 2b: đưa 4 ảnh sàn lớn lên card đồ hoạ NGAY, mỗi khung một ảnh (không dồn cả 4 vào khung đầu tiên mê cung hiện ra ⇒ khựng khi Start again / sang câu)
    { const q = [floorTex, floorNrm, floorRgh, floorEmi], tok = ++floorTok; const up = () => { if (tok !== floorTok || !q.length) return; try { renderer.initTexture(q.shift()); } catch (e) { /* bỏ qua */ } requestAnimationFrame(up); }; requestAnimationFrame(up); }
    layoutWalls(grid);
  }
  const mkPl = () => ({ r: 0, c: 0, nr: 0, nc: 0, t: 0, moving: false, dir: "u", queued: null, speed: PLAYER_SPEED, heading: Math.PI, eject: 0, walk: 0, bounce: false, cheer: 0, leave: 0, hurt: "", red: false, down: false, lift: 0, hold: null, salute: false, saluteT: 0, blastT: 0 });
  const pl = mkPl(), pl2 = mkPl();
  // 1u: hai đội (đội 0 dùng chính pl/astro/shield của chế độ Single ⇒ mọi đường Single giữ nguyên)
  const teams = [0, 1].map(i => {
    const p = i ? pl2 : pl, A = i ? astro2 : astro;
    return { i, pl: p, astro: A, shield: i ? shield2 : shield, dp: i ? dpads.r : dpads.l, meta: TEAM_META[i], lives: 0, score: 0, bombs: 0, gift: 0, status: "out", grace: 0, invuln: 0, gen: 0,
      setRed: on => { p.red = on; A.setRed(on); }, el: mount.querySelector(".mc-fteam." + (i ? "is-b" : "is-a")), bar: mount.querySelector(".mc-fbar." + (i ? "is-b" : "is-a")), sc0: -1 };
  });
  let winner = teams[0];
  let ens = [];
  const later = (sec, fn) => jobs.push({ at: gameT + sec, fn });

  const open = (e, d) => !!(grid && grid[e.r][e.c][d]);
  const bombAt = (r, c) => bombs.find(b => b.r === r && b.c === c && !b.gone);
  function entityPos(e) {
    const x0 = cellX(e.c), z0 = cellZ(e.r);
    if (!e.moving) return [x0, z0];
    return [x0 + (cellX(e.nc) - x0) * e.t, z0 + (cellZ(e.nr) - z0) * e.t];
  }
  function moveEntity(e, dt, decide, arrive) {
    let rem = dt * e.speed, guard = 4;
    while (rem > 0 && guard--) {
      if (!e.moving) {
        const d = decide(e);
        if (!d) break;
        e.dir = d; e.nr = e.r + DIRS[d].dr; e.nc = e.c + DIRS[d].dc; e.t = 0; e.moving = true;
      }
      const need = 1 - e.t;
      if (rem < need) { e.t += rem; rem = 0; }
      else { rem -= need; e.r = e.nr; e.c = e.nc; e.t = 0; e.moving = false; if (arrive(e) === false) break; }
    }
  }
  function decidePlayer(e) {
    if (e.bounce) { e.bounce = false; e.dir = null; e.queued = null; autoTo = null; return null; }   // vừa bị bật lùi khỏi bệ sai: đứng lại
    if (autoTo) { const d = bfsStep(grid, e.r, e.c, autoTo[0], autoTo[1]); if (d) return d; autoTo = null; }
    if (autoplay) {
      const tgt = pads.find(p => p.correct && !p.resolved);
      if (tgt) { const d = bfsStep(grid, e.r, e.c, tgt.r, tgt.c); if (d) return d; }
    }
    const free = d => open(e, d) && !bombAt(e.r + DIRS[d].dr, e.c + DIRS[d].dc);   // 1e: bom chặn đường
    { const T = teams.find(t => t.pl === e), want = e.queued || e.dir;              // 2b: hướng muốn đi đâm vào VÁCH CÓ CỔNG ⇒ vào cổng
      if (T && want && !open(e, want) && tryGate(T, want)) return null; }
    if (e.queued && free(e.queued)) { const d = e.queued; e.queued = null; return d; }
    return e.dir && free(e.dir) ? e.dir : null;
  }
  function decideEnemy(e) {
    const opts = DK.filter(k => open(e, k));
    if (!opts.length) return null;
    const pick = decideEnemy0(e, opts);
    return pick;                                            // 1s: KHÔNG nổ từ xa nữa — robot địch đi vào ô bom, chạm vào mới nổ (xem vòng cập nhật)
  }
  function decideEnemy0(e, opts) {
    if (Math.random() < 0.22) {
      const fwd = opts.filter(k => k !== DIRS[e.dir]?.opp);
      const pool = fwd.length ? fwd : opts;
      return pool[randi(pool.length)];
    }
    const tg = chaseTarget(e);
    return bfsStep(grid, e.r, e.c, tg.r, tg.c) || opts[randi(opts.length)];
  }
  function chaseTarget(e) {                                 // 1u: Fight ⇒ đuổi robot còn sống GẦN nhất
    if (!fight) return pl;
    let best = null, bd = 1e9;
    for (const T of teams) { if (T.status !== "in" || T.pl.down) continue; const d = Math.abs(T.pl.r - e.r) + Math.abs(T.pl.c - e.c); if (d < bd) { bd = d; best = T.pl; } }
    return best || pl;
  }
  function queueDir(d, pl = teams[0].pl) {                   // 1u: tham số robot (mặc định đội A)
    if (phase !== "play" && phase !== "count") { return; }
    if (pl.bounce) return;
    if (pl.moving && d === DIRS[pl.dir].opp && !bombAt(pl.r, pl.c)) {   // quay đầu giữa hành lang: đổi ngay (trừ khi quay vào ô bom)
      [pl.r, pl.nr] = [pl.nr, pl.r]; [pl.c, pl.nc] = [pl.nc, pl.c]; pl.t = 1 - pl.t; pl.dir = d; pl.queued = null; return;
    }
    pl.queued = d;
  }
  // hướng TRÊN MÀN → hướng mê cung: chiếu 4 hướng quanh nhân vật lên màn, lấy hướng khớp nhất
  function screenToGrid(vx, vy, pl = teams[0].pl) {
    const len = Math.hypot(vx, vy); if (len < 1e-6) return null;
    vx /= len; vy /= len;
    const [x, z] = entityPos(pl), o = new THREE.Vector3(x, 1, z).project(camera);
    let best = null, bd = -2;
    for (const k of DK) {
      const p = new THREE.Vector3(x + DIRS[k].dc * CELL, 1, z + DIRS[k].dr * CELL).project(camera);
      let sx = p.x - o.x, sy = -(p.y - o.y); const l = Math.hypot(sx, sy) || 1; sx /= l; sy /= l;
      const dot = sx * vx + sy * vy; if (dot > bd) { bd = dot; best = k; }
    }
    return best;
  }
  function playerScreen() {
    const [x, z] = entityPos(pl), v = new THREE.Vector3(x, 1.3, z).project(camera);
    return [(v.x + 1) / 2 * stageW, (1 - v.y) / 2 * stageH];
  }

  // ---------------------------------------------------------------- HUD phụ
  function renderSolo() {                                    // 2b: chế độ ĐƠN dùng đúng bộ HUD đội A của Fight: điểm LED góc trên trái + vạch năng lượng dọc (tim)
    const T = teams[0]; if (fight || !T || !T.el) return;
    T.el.innerHTML = `<div class="ft-led led"></div>`; ledSet(T.el.querySelector(".ft-led"), String(score).padStart(2, "0"));
    if (T.sc0 >= 0 && score > T.sc0) { T.el.classList.remove("is-pop"); void T.el.offsetWidth; T.el.classList.add("is-pop"); }
    T.sc0 = score; T.el.classList.remove("is-out");
    const n = Math.min(opt.lives, 12);
    T.bar.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < lives ? "on" : ""}"></i>`).join("");
    T.bar.classList.toggle("is-low", lives === 1); T.bar.classList.remove("is-out");
  }
  function renderLives() {   // nhiều tim quá thì gọn thành "♥ N" cho khỏi tràn dải trên
    renderSolo();
    livesEl.innerHTML = opt.lives > 6 ? `<i>${HEART}</i><span>${lives}</span>`
      : Array.from({ length: opt.lives }, (_, i) => `<i class="${i < lives ? "" : "is-lost"}">${HEART}</i>`).join("");
  }
  function renderTeams() {                                   // 1v: điểm LED ở góc trên · vạch năng lượng dọc sát viền (thay tim) · số bom nằm trong nút giữa D-pad
    teams.forEach(T => {
      if (!T.el) return;
      const sc = String(T.score).padStart(2, "0");
      T.el.innerHTML = `<div class="ft-led led"></div>`;   // 1w: bỏ chữ TEAM A/B — màu ô đã nói đội nào
      ledSet(T.el.querySelector(".ft-led"), sc);
      if (T.sc0 >= 0 && T.score > T.sc0) { T.el.classList.remove("is-pop"); void T.el.offsetWidth; T.el.classList.add("is-pop"); }
      T.sc0 = T.score; T.el.classList.toggle("is-out", T.status === "dead");
      const n = Math.min(opt.lives, 12);
      T.bar.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < T.lives ? "on" : ""}"></i>`).join("");
      T.bar.classList.toggle("is-low", T.lives === 1); T.bar.classList.toggle("is-out", T.status === "dead");
    });
  }
  function fitBanner() {
    qEl.style.maxWidth = ""; let fs = 2.6;
    qSpan.style.fontSize = `calc(${fs} * var(--u))`;
    while (fs > 1.3 && (qSpan.scrollHeight > qEl.clientHeight * 0.96 || qSpan.scrollWidth > qEl.clientWidth)) { fs -= 0.1; qSpan.style.fontSize = `calc(${fs.toFixed(2)} * var(--u))`; }
  }
  let countHide = 0;
  function showCount(txt) {                                   // 1k: số trong vòng HUD · 1m: bỏ GO — số cuối tự tắt sau 1 s
    const fresh = countEl.hidden;
    countEl.hidden = false; countN.textContent = txt;
    countEl.classList.remove("is-pop", "is-go", "is-in", "is-burst"); void countEl.offsetWidth;
    countEl.classList.add("is-pop"); if (fresh) countEl.classList.add("is-in");
    sfx.count();
    const my = ++countHide; later(1.02, () => { if (my === countHide) countEl.hidden = true; });
    if (txt === "1") later(0.5, () => { if (my === countHide) countEl.classList.add("is-burst"); });   // 1n: số 1 ⇒ vòng bung tan 4 phía
  }
  function minus(worldPos, txt) {
    const v = worldPos.clone().project(camera), el = document.createElement("div");
    el.className = "mc-minus"; el.textContent = txt;
    el.style.left = ((v.x + 1) / 2 * 100) + "%"; el.style.top = ((1 - v.y) / 2 * 100) + "%";
    stage.appendChild(el); setTimeout(() => el.remove(), 1200);
  }
  // 2c: KHỰNG lúc trao sang câu 1 (54 ms) = card đồ hoạ vẽ (raster) cùng một khung: câu hỏi to + thanh câu hỏi + D-pad + ô điểm LED + vạch năng lượng.
  //     Nay phần nào từ ẨN chuyển sang HIỆN thì xếp hàng, mỗi khung hiện một phần; ẩn thì ẩn ngay.
  const revealQ = [];
  function setShown(el, show) {
    if (!el) return;
    if (!show) { el.hidden = true; const i = revealQ.indexOf(el); if (i >= 0) revealQ.splice(i, 1); return; }
    if (!el.hidden || revealQ.includes(el)) return;
    revealQ.push(el); if (revealQ.length === 1) requestAnimationFrame(revealNext);
  }
  function revealNext() { const el = revealQ.shift(); if (el && phase !== "menu" && phase !== "cine" && phase !== "end") el.hidden = false; if (revealQ.length) requestAnimationFrame(revealNext); }   // đã về màn chờ/kết thúc thì thôi
  function applyDpad() {
    const on = phase !== "menu" && phase !== "end" && phase !== "cine";
    Object.values(dpads).forEach(dp => { dp.dataset.style = opt.dpadStyle; });
    setShown(dpads.l, on);                                  // 2b: đơn = 1 D-pad ở GIỮA MÉP TRÁI (chỗ đội A của Fight) · 2c: hiện lần lượt
    setShown(dpads.r, on && fight);
    paintPadTags(on);                                       // 2q: nhãn iPad theo D-pad
    stage.classList.toggle("is-fight", fight); stage.classList.toggle("is-solo", !fight);
    const inGame = phase !== "menu" && phase !== "cine" && phase !== "end";
    teams.forEach((T, i) => { const show = inGame && (fight || i === 0); setShown(T.el, show); setShown(T.bar, show); });
    if (!fight) renderSolo();
  }
  function drawMini() {
    if (!V.minimap || mini.hidden) return;
    const g = mini.getContext("2d"), w = mini.width, h = mini.height, pad = 6 * PR;
    const cs = Math.min((w - pad * 2) / COLS, (h - pad * 2) / ROWS), ox = (w - cs * COLS) / 2, oy = (h - cs * ROWS) / 2;
    if (!miniBase && grid) {
      miniBase = document.createElement("canvas"); miniBase.width = w; miniBase.height = h;
      const b = miniBase.getContext("2d");
      b.strokeStyle = "rgba(255,160,80,.9)"; b.lineWidth = Math.max(1, cs * 0.12); b.lineCap = "round"; b.beginPath();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const x = ox + c * cs, y = oy + r * cs, cl = grid[r][c];
        if (!cl.u) { b.moveTo(x, y); b.lineTo(x + cs, y); }
        if (!cl.l) { b.moveTo(x, y); b.lineTo(x, y + cs); }
        if (r === ROWS - 1 && !cl.d) { b.moveTo(x, y + cs); b.lineTo(x + cs, y + cs); }
        if (c === COLS - 1 && !cl.r) { b.moveTo(x + cs, y); b.lineTo(x + cs, y + cs); }
      }
      b.stroke();
    }
    g.clearRect(0, 0, w, h);
    if (miniBase) g.drawImage(miniBase, 0, 0);
    const dot = (x, z, col, rad) => { g.fillStyle = col; g.beginPath(); g.arc(ox + (x / CELL + (COLS - 1) / 2 + 0.5) * cs, oy + (z / CELL + (ROWS - 1) / 2 + 0.5) * cs, rad, 0, 7); g.fill(); };
    pads.forEach(p => { if (p.fade < 0) dot(cellX(p.c), cellZ(p.r), p.state === "ok" ? "#4ade80" : p.state === "bad" ? "#f87171" : "#7dd3fc", cs * 0.32); });
    ens.forEach(e => { const [x, z] = entityPos(e); dot(x, z, e.color, cs * 0.26); });
    const [px, pz] = entityPos(pl); dot(px, pz, "#ffffff", cs * 0.3);
    if (fight) { const [qx, qz] = entityPos(pl2); dot(qx, qz, "#fb923c", cs * 0.3); }
  }

  // ---------------------------------------------------------------- nhịp ván
  let robotFree = false, introRobot = false, introMap = null, firstMapOverride = null, curMapSrc = null;
  function startGame(o = {}) {
    if (intro && (intro.active || intro.tailing)) intro.abort();   // 1o: Start again giữa intro ⇒ dừng intro
    cineCam = null;
    firstMapOverride = o.fromIntro ? introMap : null; introRobot = !!o.fromIntro;   // 1p: câu 1 nối liền intro
    sfx.unlock(); sfx.click(); sfx.humOn();
    order = questions.map((q, i) => i); if (opt.shuffle) shuffle(order);
    results = order.map(i => ({ q: questions[i], correct: false, wrong: [] }));
    qi = 0; score = 0; lives = opt.lives; playT = 0; firstQ = true; jobs = []; paused = false; nextMap = makeDeck();
    setFightMode(!!opt.fight); rings.forEach(r => { r.visible = false; });   // 1x: thầy bỏ vòng dưới chân robot
    teams.forEach(T => { Object.assign(T, { lives: opt.lives, score: 0, bombs: opt.bombs, gift: 0, status: "out", grace: 0, invuln: 0 }); T.gen++; T.setRed(false); });
    winner = teams[0];
    bombsLeft = opt.bombs; correctSinceGift = 0; clearBombs(); paintBombs(); swapEl.hidden = true; invulnUntil = 0;
    const diff = opt.difficulty;
    enemyCount = diff <= 3 ? 1 : diff <= 6 ? 2 : diff <= 8 ? 3 : 4;
    enemySpeed = 1000 / Math.max(230, 400 - diff * 14) * SPEED_SCALE;
    ovStart.hidden = ovEnd.hidden = ovPause.hidden = true;
    setShown(topEl, true); bar.hidden = false; mini.hidden = !V.minimap;   // 2c: thanh câu hỏi cũng hiện theo lượt
    scoreEl.textContent = "0"; renderLives(); renderTeams(); paintPct(); setRed(false); applyDpad();
    fit();
    nextQuestion();
  }
  function nextQuestion() {
    phase = "intro"; applyDpad();
    const q = results[qi].q;
    clearBombs(); hatches.clear(); gates.clear(); gatePair = null; pl.warp = pl2.warp = null; pl.lift = 0; pl.hold = null; pl.salute = false; pl2.lift = 0; pl.fly = pl2.fly = 0; pl2.hold = null; pl2.salute = false;
    const m = firstMapOverride || nextMap(); firstMapOverride = null;
    if (m !== curMapSrc || !introRobot) useMap(m, true); miniBase = null;   /* 2p: sàn vẽ chia khung trong lúc câu hỏi to che màn */      // 1p: map đã dựng sẵn trong intro ⇒ không dựng lại (sàn không đổi)
    $(".mc-mapname").textContent = "Map · " + m.name;
    if (!introWallsUp) { wallAnim.dir = -1; wallAnim.t = 99; paintWalls(); }   /* tường nằm phẳng chờ dựng · 2f: intro đã dựng lúc robot quay người thì giữ */
    clearPads();
    { const s0 = spawnOf(0); Object.assign(pl, { r: s0.r, c: s0.c, t: 0, moving: false, queued: null, eject: 0, bounce: false, cheer: 0, leave: 0 }); }
    const d0 = DK.find(k => open(pl, k)) || "u";
    pl.dir = null;                                           // đứng yên chờ lệnh đầu tiên (như Wordwall)
    if (!(introRobot && firstQ)) pl.heading = Math.atan2(DIRS[d0].dc, DIRS[d0].dr);   // 1r: vừa xong intro ⇒ robot vẫn nhìn ra máy quay
    if (firstQ) cam.yaw = pl.heading;
    if (fight) {                                              // 1u: robot đội B đứng cạnh, cùng hướng; đội đã hết tim thì vắng mặt
      const m = mateRC();
      Object.assign(pl2, { r: m.r, c: m.c, nr: m.r, nc: m.c, t: 0, moving: false, queued: null, eject: 0, bounce: false, cheer: 0, leave: 0, hurt: "", down: false, dir: null, heading: pl.heading, lift: 0, hold: null, salute: false });
      teams.forEach(T => { T.gen++; if (T.status !== "dead") T.status = "in"; T.invuln = 0; T.setRed(false); T.pl.hurt = ""; T.pl.down = false; });
      if (!introRobot) astro2.g.visible = false;
      teams.forEach(T => { if (T.status === "dead") T.astro.g.visible = false; });
      renderTeams();
    }
    if (!introRobot) astro.g.visible = false;                 // 1p: robot vừa trồi lên ở cuối intro — giữ nguyên
    ens = []; drones.forEach(d => { d.g.visible = false; });
    qSpan.textContent = q.question || "";
    requestAnimationFrame(fitBanner);
    bigq.querySelector("span").textContent = q.question || "";
    bigq.hidden = false; bigq.classList.remove("is-out"); bigq.classList.add("is-in");
    sfx.reveal(); preLabels(q);
    if (firstQ && !warmedInGame) { later(0.3, warmInGame); later(1.0, warmInGame2); }
    qEl.classList.add("is-wait");                                     // 2d: câu hỏi to đang giữa màn ⇒ dòng câu hỏi trên cùng chưa hiện
    if (introRobot && firstQ) { later(5.2 - 1.0 - 3.0, () => raiseWallsIntro()); later(5.2 - 1.0, () => spawnEnemies()); }   /* 2h: tường dựng 3 s trước khi địch trồi */   /* 2f: 1 s trước khi câu hỏi bay lên ⇒ địch trồi lên */
    later(firstQ ? 5.2 : 4.7, () => { finishDeck(); flyBigq(); setAlarm(false); buildMaze(q); });   /* 2p: finishDeck — sàn chắc chắn xong trước khi dựng tường */   // 1m: câu hỏi to hiện thêm 3 s
  }
  // 2d: hết giờ đọc ⇒ chữ câu hỏi to BAY + thu nhỏ vào đúng chỗ dòng câu hỏi trên cùng, nền tối tan dần; tới nơi thì dòng trên hiện, chữ to ẩn
  // 2f: robot địch trồi lên qua nắp boong ở các góc (tách khỏi buildMaze để cuối intro gọi sớm)
  let enemiesUp = false, introWallsUp = false;
  function raiseWallsIntro() { introWallsUp = true; wallAnim.dir = 1; wallAnim.t = 0; wallAnim.ox = cellX(START.c); wallAnim.oz = cellZ(START.r); sfx.build(); }
  function spawnEnemies(fromBuild) {
    ens = [];
    for (let i = 0; i < enemyCount; i++) {
      const [r, c] = espots[i % espots.length], d = drones[i];
      const e = { r, c, nr: r, nc: c, t: 0, moving: false, dir: "u", speed: enemySpeed, drone: d, color: i % 2 ? "#c084fc" : "#ef4444", born: gameT + 1.3 + i * 0.12, heading: 0, fly: null, lift: -E_DEPTH, hold: null };
      ens.push(e); later(i * 0.12, () => enemyRise(e));
    }
    sfx.enemy(); if (!fromBuild) enemiesUp = true;
  }
  function flyBigq() {
    const bs = bigq.querySelector("span");
    if (bigq.hidden || !bs.textContent) { qEl.classList.remove("is-wait"); bigq.hidden = true; return; }
    const br = bs.getBoundingClientRect(), qr = qSpan.getBoundingClientRect();
    const sc = parseFloat(getComputedStyle(qSpan).fontSize) / Math.max(1, parseFloat(getComputedStyle(bs).fontSize));
    const dx = (qr.left + qr.width / 2) - (br.left + br.width / 2), dy = (qr.top + qr.height / 2) - (br.top + br.height / 2);
    bigq.classList.remove("is-in", "is-out"); bigq.classList.add("is-fly"); void bs.offsetWidth;
    bs.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
    later(0.62, () => { qEl.classList.remove("is-wait"); bigq.hidden = true; bigq.classList.remove("is-fly"); bs.style.transform = ""; });
  }
  function buildMaze(q) {
    phase = "build";
    if (introWallsUp) introWallsUp = false;                           /* 2f: tường đã dựng trong intro */
    else { wallAnim.dir = 1; wallAnim.t = 0; wallAnim.ox = cellX(START.c); wallAnim.oz = cellZ(START.r); sfx.build(); }
    const answers = shuffle(q.answers.filter(a => a && a.text != null).slice());
    const spots = fight && SPAWN[0] ? pickFightSpots(answers) : pickSpots(answers.length, START.r, START.c, grid, espots);   // 1x: Fight công bằng
    pads = answers.map((a, i) => makePad(spots[i][0], spots[i][1], a.text, !!a.correct, i));
    teams.forEach(T => { T.pl.gateCd = 0; T.pl.warp = null; }); placeGates();   // 1y: cặp cổng của câu này
    { const tok = ++gateTok, at = 1.3 + 3 + 1.5 + Math.random() * 4.5;   // 1z: mở NGẪU NHIÊN 1,5–6 s sau khi hết đếm (không cùng lúc robot xuất hiện)
      later(at, () => { if (tok !== gateTok || !gatePair || (phase !== "play" && phase !== "swap")) return; gates.open(); sfx.gateOpen(); gatePair.forEach(g => burst(cellX(g.c), 1.8, cellZ(g.r), 0xc084fc, 70, 6, 4, 0.9)); }); }
    later(0.1, () => { if (introRobot) { introRobot = false; if (!fight) teamSink(); } else if (fight) teams.forEach(T => { if (T.status !== "dead") appearPlayer(1, T); }); else appearPlayer(); });
    if (enemiesUp) enemiesUp = false; else later(0.8, () => spawnEnemies(true));   /* 2f: địch đã trồi lên sớm (cuối intro) thì thôi */
    later(1.3, () => {
      phase = "count"; applyDpad();
      const seq = ["3", "2", "1"];                                     // 1m: MỌI câu đếm 3-2-1 (bỏ 5-4, bỏ GO), hết số là chơi
      seq.forEach((s, i) => later(i, () => showCount(s)));
      later(seq.length, () => { phase = "play"; graceUntil = gameT + GRACE; teams.forEach(T => { T.grace = gameT + GRACE; T.invuln = 0; }); firstQ = false; sfx.go(); });
    });
  }
  // ================= 1e: BOM
  function paintBombs() {
    bombsEl.querySelector("b").textContent = bombsLeft;
    bombsEl.classList.toggle("is-empty", bombsLeft <= 0);
    if (fight) { teams.forEach(T => { const h = T.dp.querySelector(".hub"); h.classList.toggle("is-empty", T.bombs <= 0); h.querySelector(".hub-n").textContent = T.bombs; }); renderTeams(); return; }   // 1u: mỗi đội bom riêng · 1v: số bom nhỏ giữa quả bom
    Object.values(dpads).forEach(dp => { const h = dp.querySelector(".hub"); h.classList.toggle("is-empty", bombsLeft <= 0); h.querySelector(".hub-n").textContent = bombsLeft; });   // 1f: chỉ icon, hết bom thì mờ · 1v: + số nhỏ giữa quả bom
  }
  function placeBomb(T = teams[0]) {
    const pl = T.pl, have = fight ? T.bombs : bombsLeft;
    if (phase !== "play" || pl.eject > 0 || have <= 0 || (fight && T.status !== "in")) { if (phase === "play" && have <= 0) sfx.wrong(); return; }
    const r = pl.moving && pl.t > 0.5 ? pl.nr : pl.r, c = pl.moving && pl.t > 0.5 ? pl.nc : pl.c;
    if (bombAt(r, c) || pads.some(p => p.r === r && p.c === c && p.fade < 0) || gateAt(r, c) >= 0) return;   // 1y: + ô cổng
    spawnBomb(r, c);
    if (fight) T.bombs--; else bombsLeft--;
    paintBombs(); sfx.click(); sfx.tick();
  }
  // 1h: thanh thời gian nổ trên đầu quả bom (luôn quay về máy quay): đầy → cạn trong 5 s, xanh → vàng → đỏ
  const FB_W = 4.4, FB_H = 0.62;   // to đủ để nhìn rõ từ góc máy trên cao
  const fbBgGeo = new THREE.PlaneGeometry(FB_W + 0.14, FB_H + 0.14), fbGeo = new THREE.PlaneGeometry(FB_W, FB_H).translate(FB_W / 2, 0, 0);
  function spawnBomb(r, c) {
    const b = makeBomb(); b.g.position.set(cellX(c), 0, cellZ(r)); b.g.scale.setScalar(0.01); station.add(b.g);
    const bar = new THREE.Group(); bar.position.set(cellX(c), 4.2, cellZ(r)); station.add(bar);
    const bg = new THREE.Mesh(fbBgGeo, new THREE.MeshBasicMaterial({ color: 0x0b1020, transparent: true, opacity: 0.85, depthTest: false, toneMapped: false }));
    const fill = new THREE.Mesh(fbGeo, new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, depthTest: false, toneMapped: false }));   // cùng nhóm "trong suốt" với nền ⇒ thứ tự vẽ đúng, nền không phủ lên
    fill.position.set(-FB_W / 2, 0, 0.01); bg.renderOrder = 8; fill.renderOrder = 9; bar.add(bg, fill);
    const o = { r, c, obj: b, t: 0, gone: false, bar, fill, sec: 0 }; bombs.push(o); return o;
  }
  const _fc = new THREE.Color();
  function paintFuse(b) {
    const f = Math.max(0, 1 - b.t / FUSE_S);
    b.fill.scale.x = Math.max(0.001, f);
    _fc.setHex(f > 0.5 ? 0x4ade80 : 0xfacc15).lerp(new THREE.Color(f > 0.5 ? 0xfacc15 : 0xef4444), f > 0.5 ? (1 - f) * 2 : (0.5 - f) * 2);
    b.fill.material.color.copy(_fc);
    b.bar.quaternion.copy(camera.quaternion);
  }
  function dropBar(b) { station.remove(b.bar); b.bar.children.forEach(m => m.material.dispose()); }
  // 1h: nổ PHÁ các vách dính vào ô bom (giữ tường bao ngoài trạm) ⇒ dựng lại tường + gạch vụn văng ra
  function breakWalls(b) {
    const cell = grid && grid[b.r] && grid[b.r][b.c]; if (!cell) return;
    const bx = cellX(b.c), bz = cellZ(b.r), broken = [];
    for (const k of DK) {
      const nr = b.r + DIRS[k].dr, nc = b.c + DIRS[k].dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || !grid[nr][nc].on || cell[k]) continue;
      cell[k] = true; grid[nr][nc][DIRS[k].opp] = true; broken.push(k);
    }
    if (!broken.length) return;
    layoutWalls(grid);
    const d0 = wallAnim.dir, t0 = wallAnim.t; wallAnim.dir = 1; wallAnim.t = 99; paintWalls(); wallAnim.dir = d0; wallAnim.t = t0;
    const wc = wallMesh.material.color.getHex(), cc = capMesh.material.color.getHex();
    broken.forEach(k => boom.rubble(bx + DIRS[k].dc * CELL / 2, bz + DIRS[k].dr * CELL / 2, bx, bz, wc, cc));
  }
  // 2b: robot mình có bị bom ở ô (br, bc) quét trúng không — cùng ô, hoặc ô kề mà vách giữa hai ô đang MỞ (trước khi nổ phá vách)
  function blastReaches(open0, br, bc, x, z) {
    const r = Math.round(z / CELL + (ROWS - 1) / 2), c = Math.round(x / CELL + (COLS - 1) / 2);
    if (r === br && c === bc) return true;
    const k = DK.find(d => DIRS[d].dr === r - br && DIRS[d].dc === c - bc);
    return !!(k && open0[k]);
  }
  function detonate(b) {
    if (b.gone) return;
    b.gone = true; station.remove(b.obj.g); dropBar(b);
    const x = cellX(b.c), z = cellZ(b.r);
    const cell0 = grid && grid[b.r] && grid[b.r][b.c], open0 = {}; DK.forEach(d => { open0[d] = !!(cell0 && cell0[d]); });   // 2b: vách TRƯỚC khi nổ
    breakWalls(b);
    boom.explode(x, z, 1); sfx.boom?.();   /* 2j: bỏ tiếng giật điện */
    cam.trauma = 1; stage.classList.remove("is-shake"); void stage.offsetWidth; stage.classList.add("is-shake");
    // robot trong tầm ⇒ vỡ tung, nằm lại thành xác; KHÔNG quay lại ở câu này
    for (const e of ens.slice()) {
      const [ex, ez] = entityPos(e);
      if (Math.hypot(ex - x, ez - z) < BLAST_R) {
        e.drone.g.visible = false; boom.wreck(ex, ez, e.drone.color ?? (e.color === "#ef4444" ? 0xe53935 : 0xa855f7));
        ens.splice(ens.indexOf(e), 1); sfx.robotBoom(true);   /* 2j: robot địch nổ = nổ thật */
      }
    }
    // bom khác trong tầm nổ lan theo
    for (const o of bombs) if (!o.gone && Math.hypot(cellX(o.c) - x, cellZ(o.r) - z) < BLAST_R) later(0.12, () => detonate(o));
    // người đứng sát ⇒ dính bom, mất mạng
    if (fight) {                                                      // 1u: bom hại CẢ HAI đội (kể cả bom đối thủ đặt)
      for (const T of teams) { const [tx, tz] = entityPos(T.pl);
        if (phase === "play" && T.status === "in" && T.pl.eject <= 0 && !T.pl.warp && T.pl.lift > -0.5 && gameT > T.invuln && Math.hypot(tx - x, tz - z) < NEAR_R && blastReaches(open0, b.r, b.c, tx, tz)) hitTeam(T, "bomb"); }
      return;
    }
    const [px, pz] = entityPos(pl);
    if (phase === "play" && pl.eject <= 0 && !pl.warp && gameT > invulnUntil && Math.hypot(px - x, pz - z) < NEAR_R && blastReaches(open0, b.r, b.c, px, pz)) hitPlayer("bomb");
  }
  function clearBombs() { bombs.forEach(b => { if (!b.gone) { station.remove(b.obj.g); dropBar(b); } }); bombs = []; boom.clear(); }

  // ================= 1e: ĐỔI NGƯỜI — mỗi HS 1 mạng
  function startSwap(delay, spot) {
    phase = "swap"; applyDpad();
    later(delay, () => {
      if (phase !== "swap") return;
      // robot bay về góc xuất phát (theo đường cong); người: ô sai ⇒ hiện lại ĐÚNG chỗ đó (giữ hướng mặt), còn lại ⇒ về giữa sân
      // 1i: địch — nắp boong mở ngay dưới robot, hạ xuống, đóng; rồi nắp ở góc xuất phát mở, đưa robot lên
      ens.forEach((e, i) => {
        const [x, z] = entityPos(e), [r, c] = espots[i % espots.length];
        e.hold = [x, z]; Object.assign(e, { r, c, nr: r, nc: c, t: 0, moving: false });
        hatches.run(x, z, { mode: "sink", depth: E_DEPTH, speed: 1.25, onLift: v => { e.lift = v; }, onHidden: () => { e.hold = null; enemyRise(e, 1.25); } });
      });
      const to = spot || START;
      if (astro.g.visible) {                                             // robot đỏ: hạ xuống qua nắp boong rồi robot mới mới lên
        const [ox, oz] = entityPos(pl); pl.hold = [ox, oz];
        hatches.run(ox, oz, { mode: "sink", depth: P_DEPTH, speed: 1.25, onLift: v => { pl.lift = v; }, onHidden: () => { astro.g.visible = false; pl.hold = null; if (phase === "swap") appearPlayer(1.25); } });
      } else later(0.25, () => { if (phase === "swap") appearPlayer(1.25); });
      Object.assign(pl, { r: to.r, c: to.c, t: 0, moving: false, queued: null, dir: null, bounce: false, eject: 0 });
      bombsLeft = opt.bombs; paintBombs();
      swapEl.hidden = false;   // 1g: chỉ còn số đếm · 1m: vẫn câu đó ⇒ chỉ đếm 3-2-1, không GO
      for (let k = 0; k < SWAP_S; k++) later(k, () => { if (phase === "swap") showCount(String(SWAP_S - k)); });
      later(SWAP_S, () => { swapEl.hidden = true; countEl.hidden = true; if (phase !== "swap") return; phase = "play"; graceUntil = gameT + SHIELD_S; invulnUntil = 0; applyDpad(); sfx.go(); });   // 1h: hào quang 3 s
    });
  }
  // ================= 1u: FIGHT — một đội trúng đòn (địch / bom / ô sai): chỉ đội đó nổ hoặc đỏ, mất 1 tim, hồi sinh; đội kia chơi tiếp
  function hitTeam(T, why, spot) {
    const p = T.pl, A = T.astro;
    if (why === "enemy") sfx.hit(); cam.trauma = why === "enemy" ? 0.15 : 0.8;   /* 2j: nổ ⇒ tiếng nổ lúc thân vỡ */                 // 2b: bị địch đụng ⇒ không rung màn
    const [x, z] = entityPos(p);
    if (why !== "enemy") { stage.classList.remove("is-shake"); void stage.offsetWidth; stage.classList.add("is-shake"); }
    T.invuln = gameT + 99; p.eject = EJECT; p.down = true; T.status = "down";
    if (why === "enemy") { p.hurt = "red"; p.redT = 0; T.setRed(true); }   // 2b: bỏ tia đỏ bắn ra
    else { p.hurt = "blast"; p.moving = false; p.blastT = 0; }
    minus(new THREE.Vector3(x, 3.4, z), "−1");
    T.lives = Math.max(0, T.lives - 1); renderTeams();
    const g = ++T.gen;
    if (T.lives <= 0) {
      later(0.9, () => {
        if (g !== T.gen) return;
        T.status = "dead"; p.hold = null; renderTeams();
        if (why === "enemy" && A.g.visible) { const [ex, ez] = entityPos(p); const bp = astroBodyPoints(A); A.g.visible = false; boom.fireflies(ex, ez, { n: 420, pts: bp.pts, center: bp.center, hold: 0.07 }); }
        A.g.visible = false; T.setRed(false); p.hurt = ""; p.down = false;
        if (teams.every(t => t.status === "dead") && phase === "play") { phase = "dead"; applyDpad(); later(0.9, () => endGame("over")); }
      });
      return;
    }
    later(1.0, () => {
      if (g !== T.gen || phase !== "play") return;
      const to = spot || spawnOf(T.i);
      const back = () => {
        if (g !== T.gen || phase !== "play") return;
        A.g.visible = false; p.hold = null; p.hurt = ""; p.down = false; T.setRed(false);
        Object.assign(p, { r: to.r, c: to.c, nr: to.r, nc: to.c, t: 0, moving: false, queued: null, dir: null, bounce: false, eject: 0, lift: 0 });
        T.grace = gameT + SHIELD_S; T.invuln = 0; T.status = "in";
        appearPlayer(1.25, T);
      };
      if (A.g.visible) {                                            // robot đỏ còn đứng đó: hạ qua nắp boong, rồi robot mới lên
        const [ox, oz] = entityPos(p); p.hold = [ox, oz];
        hatches.run(ox, oz, { mode: "sink", depth: P_DEPTH, speed: 1.25, onLift: v => { p.lift = v; }, onHidden: back });
      } else back();
    });
  }
  function hitPlayer(why, spot) {
    if (why === "enemy") sfx.hit(); cam.trauma = why === "enemy" ? 0.15 : 0.8;   /* 2j: nổ ⇒ tiếng nổ lúc thân vỡ */                 // 2b: bị địch đụng ⇒ không rung màn (chỉ đỏ nhấp nháy)
    const [x, z] = entityPos(pl);
    if (why !== "enemy") { stage.classList.remove("is-shake"); void stage.offsetWidth; stage.classList.add("is-shake"); }
    invulnUntil = gameT + 99; pl.eject = EJECT; pl.down = true;
    if (why === "enemy") { pl.hurt = "red"; pl.redT = 0; setRed(true); }   // 1h: giữ nguyên hình, chuyển đỏ · 2b: bỏ tia đỏ bắn ra
    else { pl.hurt = "blast"; pl.moving = false; pl.blastT = 0; }                                         // 1i: nổ trước ⇒ hất lên ⇒ vỡ ngay khi vừa bay lên
    loseLife(spot);
  }

  function appearPlayer(speed = 1, T = teams[0]) {          // 1i: NẮP BOONG mở ⇒ bệ nâng đưa robot lên ⇒ nắp đóng
    const pl = T.pl, astro = T.astro;
    T.setRed(false); pl.hurt = ""; pl.down = false; pl.salute = false; pl.hold = null; pl.fly = 0; astro.body.position.y = 0; astro.body.rotation.set(0, 0, 0);
    astro.g.visible = true; astro.g.scale.setScalar(1.75); pl.lift = -P_DEPTH;
    const [x, z] = entityPos(pl);
    sfx.sink();
    hatches.run(x, z, { mode: "rise", depth: P_DEPTH, speed, onLift: v => { pl.lift = v; }, onOpen: () => sfx.hatch(), onDone: () => { pl.lift = 0; } });
  }
  // ⚡ làm nóng LẦN 2, trong lúc màn đầu còn hiện câu hỏi to: cho robot vỡ thử 1 lần DƯỚI SÀN (không ai thấy) và vẽ 1 khung với
  //    đúng trạng thái trận đấu ⇒ trình duyệt dịch sẵn các chương trình vẽ mảnh vỡ. Đo: lần vỡ đầu 70 ms → nay như các lần sau.
  //    Vẽ vào một khung ẨN (render target riêng) ⇒ người chơi không thấy gì; gồm cả nổ, xác địch, gạch tường, bom, nắp boong, tàu.
  let warmedInGame = false;
  function warmInGame() {
    if (warmedInGame) return; warmedInGame = true;
    const vis = astro.g.visible;
    const fleet = ship.warmObjects().map(o => ({ o, v: o.visible, p: o.position.clone(), s: o.scale.clone() }));
    const dr = drones.map(d => ({ d, v: d.g.visible, p: d.g.position.clone() }));
    try {                                                               // (1) mảnh vỡ: vỡ thử DƯỚI SÀN, vẽ khung thật (cách này mới khớp)
      const py = astro.g.position.y; astro.g.visible = true; astro.g.position.y = -5; astro.g.updateMatrixWorld(true);
      boom.fireflies(0, 0, { n: 20 });                                  // robot mình vẫn HIỆN (dưới sàn) để vật liệu của nó cũng được chuẩn bị
      drones.forEach((d, i) => { d.g.visible = true; d.g.position.set(i * 3 - 5, -8, 2); });
      const wp = makePad(0, 0, "warm", false, 0); wp.g.position.y = -8; wp.g.scale.setScalar(1);   // + 1 bệ đáp án
      const hs = []; for (let k = 0; k < 4; k++) hs.push(hatches.run(k * 4 - 6, 4, { mode: "rise" }));
      hatches.update(0.6, gameT); hs.forEach(o => { o.h.g.position.y = -8; });     // nắp boong (đang mở) cũng dưới sàn
      fleet.forEach(({ o }, i) => { o.visible = true; o.position.set(i * 2, -6, 0); o.scale.setScalar(0.02); });   // tàu thu nhỏ, giấu dưới sàn
      underdeck.update(0.016, 0); renderer.shadowMap.needsUpdate = true; portal.render(scene, camera);   // vẽ thử ảnh nhìn xuống hầm (đèn riêng của hầm) · 2b: + BÓNG của vật trong hầm (lần đầu robot trồi lên khựng 90 ms vì dịch shader bóng)
      renderer.setRenderTarget(composer.renderTarget1); renderer.compile(scene, camera); renderer.setRenderTarget(null);   // 2b: dịch mọi vật đang hiện, bất kể có trong khung nhìn không
      composer.render(); boom.clear(); hatches.clear(); astro.g.position.y = py; astro.g.updateMatrixWorld(true);
      fleet.forEach(({ o, s }) => o.scale.copy(s));
      // 2b: KHÔNG dispose vật liệu bệ mẫu — dispose là trình duyệt bỏ luôn shader cột sáng/vòng bệ vừa dịch ⇒ câu đầu phải dịch lại (khựng)
      station.remove(wp.g); wp.tex.dispose(); wp.lab.geometry.dispose();
    } catch (e) { /* bỏ qua */ }
    boom.clear(); hatches.clear();
    astro.g.visible = vis; fleet.forEach(({ o, v, p }) => { o.visible = v; o.position.copy(p); }); dr.forEach(({ d, v, p }) => { d.g.visible = v; d.g.position.copy(p); });
  }
  function warmInGame2() {                                  // 1j: phần 2 tách sang khung khác ⇒ không dồn một lần đứng hình dài
    const rt = new THREE.WebGLRenderTarget(256, 160, { type: THREE.HalfFloatType });
    try {                                                               // (2) các hiệu ứng còn lại: vẽ vào khung ẩn
      boom.explode(0, 0, 0.3); boom.wreck(4, 0, 0xe53935); boom.rubble(0, 4, 0, 0, wallMesh.material.color.getHex(), capMesh.material.color.getHex());
      const wb = makeBomb(); station.add(wb.g);
      boom.update(0.016);
      renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null);
      station.remove(wb.g);
    } catch (e) { /* bỏ qua */ }
    boom.clear(); rt.dispose();
  }
  function enemyRise(e, speed = 1) {                        // 1i: địch lên từ nắp boong ở góc xuất phát
    const [x, z] = entityPos(e); e.lift = -E_DEPTH; e.drone.g.visible = true; e.drone.g.scale.setScalar(1.6);
    hatches.run(x, z, { mode: "rise", depth: E_DEPTH, speed, onLift: v => { e.lift = v; }, onDone: () => { e.lift = 0; } });
  }
  function checkPad(T = teams[0]) {
    const pl = T.pl;
    const p = pads.find(p => !p.resolved && p.r === pl.r && p.c === pl.c);
    if (!p) return true;
    p.resolved = true; winner = T;
    const wp = new THREE.Vector3(cellX(p.c), 2, cellZ(p.r));
    if (p.correct) {
      setPadState(p, "ok"); results[qi].correct = true; results[qi].by = T.i;
      if (fight) { T.score++; renderTeams(); } else { score++; scoreEl.textContent = score; renderSolo(); }
      p.flip = 0; pl.salute = true; pl.saluteT = gameT; pl.heading = 0;   // 1i: quay mặt ra khán giả, đứng CHÀO tới hết màn
      const doomed = ens; ens = [];                                       // 1i: địch nổ tung ngay, xác cháy tại chỗ
      doomed.forEach((e, i) => later(0.1 + i * 0.16, () => {
        const [ex, ez] = e.hold || entityPos(e);
        e.drone.g.visible = false; boom.explode(ex, ez, 0.6); boom.wreck(ex, ez, e.drone.color ?? 0xe53935); sfx.robotBoom(i === 0);   /* 2j: nổ thật */
        cam.trauma = Math.max(cam.trauma, 0.35);
      }));
      if (fight) { if (opt.bombGift > 0 && ++T.gift >= opt.bombGift) { T.gift = 0; if (T.bombs < 10) { T.bombs++; paintBombs(); later(0.3, () => sfx.gift?.()); } } }   // 1u: quà bom theo đội
      else if (opt.bombGift > 0 && ++correctSinceGift >= opt.bombGift) { correctSinceGift = 0; if (bombsLeft < 10) { bombsLeft++; paintBombs(); later(0.3, () => sfx.gift?.()); } }   // 1e: tặng bom
      burst(wp.x, SIGN_Y + 1.2, wp.z, 0x4ade80, 120, 9, 6, 1.2); sfx.correct();
      phase = "hold"; applyDpad();
      later(HOLD, endQuestion);
      return false;
    }
    // 1h: ô SAI ⇒ nổ đùng như dính bom: bệ vỡ (chỉ còn vệt cháy), robot nảy lên vỡ tung; 3-2-1 rồi robot mới hiện ĐÚNG chỗ này
    results[qi].wrong.push(p.text);
    p.g.visible = false; p.fade = 9;
    boom.explode(wp.x, wp.z, 1); sfx.wrong(); sfx.boom?.();
    if (fight) hitTeam(T, "pad", { r: p.r, c: p.c }); else hitPlayer("pad", { r: p.r, c: p.c });
    return false;
  }
  function loseLife(spot) {
    lives = Math.max(0, lives - 1); renderLives();
    if (lives <= 0) { phase = "dead"; later(0.9, () => endGame("over")); return; }
    startSwap(0.9, spot);                                        // 1e: mỗi mạng một học sinh ⇒ đổi người
  }
  function hitByEnemy() { hitPlayer("enemy"); }
  function endQuestion() {
    for (const T of (fight ? teams : [teams[0]])) {          // 1u: mọi đội còn robot · 2b: KHÔNG hạ xuống boong nữa — bật phản lực BAY LÊN TRỜI
      const p = T.pl, A = T.astro; if (!A.g.visible) continue;
      const [lx, lz] = entityPos(p); p.hold = [lx, lz]; p.fly = 1e-4; p.moving = false;
    }
    sfx.flyUp();   /* 2k: phản lực ba lô (thay teleport) */
    { const cp = pads.find(p => p.correct); if (cp) cp.fade = 0; }       // bệ đúng tan đi để nắp boong mở gọn dưới chân
    wallAnim.dir = -1; wallAnim.t = 0; wallAnim.ox = cellX(winner.pl.c); wallAnim.oz = cellZ(winner.pl.r);
    sfx.sink();
    pads.forEach(p => { if (p.fade < 0 && !p.correct) p.fade = 0; });
    gates.close();                                                    // 1y: cổng thu lại khi mê cung sụp
    ens.forEach(e => { const [x, z] = entityPos(e); burst(x, 1.3, z, e.color, 30, 5, 3, 0.6); e.drone.g.visible = false; });
    ens = [];
    later(1.75, () => {
      qi++; paintPct();
      if (qi >= results.length) endGame("complete"); else nextQuestion();
    });
  }
  function endGame(kind) {
    setAlarm(false); introWallsUp = false; enemiesUp = false;   /* 2f */
    phase = "end"; applyDpad(); sfx.humOff();
    kind === "complete" ? sfx.win() : sfx.over();
    $(".mc-end-title").textContent = kind === "complete" ? "Game complete" : kind === "time" ? "Time's up" : "Game over";   // 2d: + hết giờ đếm ngược
    $(".mc-showans").hidden = !opt.showAnswers;                                                                          // 2d: Options ▸ Show answers at end
    $(".mc-end-score .es-n").textContent = score; $(".mc-end-score .es-of").textContent = `/ ${results.length}`;   // 1l: điểm trong vòng HUD
    if (fight) {                                                            // 1u: nhiều điểm thắng; hoà điểm ⇒ so số tim; vẫn hoà ⇒ hoà
      const [a, b] = teams, w = a.score !== b.score ? (a.score > b.score ? 0 : 1) : a.lives !== b.lives ? (a.lives > b.lives ? 0 : 1) : -1;
      $(".mc-end-title").textContent = "ANDREW CLASSES";   // 1x: bỏ TEAM X WINS — mũi tên đã chỉ đội thắng
      // 1w: chỉ "X : Y"; đội thắng có mũi tên sáng cạnh số, chỉ về phía đội đó (A trái, B phải)
      const ARW = d => `<svg class="es-arw is-${d}" viewBox="0 0 40 40"><path d="${d === "l" ? "M30 4 L6 20 L30 36 L24 20 Z" : "M10 4 L34 20 L10 36 L16 20 Z"}"/></svg>`;   // 1x: mũi tên ĐẶC
      $(".mc-end-score .es-n").innerHTML = `${w === 0 ? ARW("l") : ""}<span class="es-a${w === 0 ? " is-win" : ""}">${a.score}</span><i class="es-c">:</i><span class="es-b${w === 1 ? " is-win" : ""}">${b.score}</span>${w === 1 ? ARW("r") : ""}`;
      $(".mc-end-score .es-of").textContent = "";
    }
    $(".mc-end-sub").innerHTML = `${IC.clock}<span>${fmt(playT)}</span>`;
    const ans = $(".mc-ans"); ans.hidden = true;
    // 1m: mỗi câu: đáp án SAI đã chọn (gạch, đỏ) + đáp án ĐÚNG (xanh); câu chưa chơi tới (END GAME giữa chừng) ghi "not played"
    ans.innerHTML = results.map((r, i) => {
      const right = (r.q.answers.find(a => a.correct) || {}).text || "";
      const played = r.correct || r.wrong.length || i < qi;
      const wr = r.wrong.map(w => `<s>✗ ${escapeHtml(w)}</s>`).join("");
      const tail = !played ? `<em>not played</em>` : `${wr}<b>✓ ${escapeHtml(right)}</b>`;
      return `<div class="${!played ? "na" : r.correct && !r.wrong.length ? "" : "no"}"><span>${i + 1}.</span><span>${escapeHtml(r.q.question)}</span><p>${tail}</p></div>`;
    }).join("");
    $(".mc-ov-end .mc-card").classList.remove("is-ans"); $(".mc-showans").textContent = "Show answers";
    later(0.6, () => { ovEnd.hidden = false; });
  }
  function toMenu() {
    setAlarm(false); introWallsUp = false; enemiesUp = false;   /* 2f */
    phase = "menu"; paused = false; jobs = []; sfx.humOff();
    ovPause.hidden = ovEnd.hidden = true; ovStart.hidden = false; topEl.hidden = true; bar.hidden = true; mini.hidden = true; countEl.hidden = true; bigq.hidden = true;
    clearPads(); clearBombs(); hatches.clear(); gates.clear(); gatePair = null; swapEl.hidden = true; ens = []; drones.forEach(d => { d.g.visible = false; }); astro.g.visible = false; astro2.g.visible = false; teams.forEach(T => { T.status = "out"; });
    wallAnim.dir = -1; wallAnim.t = 0; applyDpad();
    if (intro) intro.menu();                                   // 1p: về màn chờ ⇒ thiên hà + hạm đội
    sfx.menu?.();                                              // 2i: nhạc màn chờ
  }
  function setPaused(p) {
    if (phase === "menu" || phase === "end") return;
    paused = p; ovPause.hidden = !p;
    p ? sfx.suspend() : sfx.resume();
  }

  // ---------------------------------------------------------------- vòng cập nhật
  // hình nhân vật — dùng cho cả robot đội A và đội B (1u)
  function animRobot(pl, astro, dt) {
    const [px, pz] = pl.hold || entityPos(pl);
    if (pl.fly > 0) {                                     // 2b: xong từ ⇒ phản lực ba lô bùng, robot vọt thẳng lên trời (nhanh dần), khuất khỏi khung
      pl.fly += dt; const u = Math.max(0, pl.fly - 0.25);
      pl.lift = 0.5 * Math.sin(Math.min(1, pl.fly / 0.25) * Math.PI / 2) * 0.3 + 34 * u * u + 6 * u;
      if (pl.fly > 0.35) pl.salute = false;
      if (astro.g.visible) { burst(px, 0.02 + pl.lift + 0.9, pz, Math.random() < 0.5 ? 0xffb347 : 0x7dd3fc, 3, 1.6, -9, 0.35); }
      if (pl.fly > 1.9) astro.g.visible = false;
    }
    astro.g.position.set(px, 0.02 + pl.lift + padBump(px, pz), pz);   // 1t: trên nắp ô xuất phát thì đứng cao hơn mặt sàn đúng bằng nắp
    const s0 = astro.g.scale.x;
    if (astro.g.visible && pl.eject <= 0 && !(pl.leave > 0) && s0 < 1.75) astro.g.scale.setScalar(Math.min(1.75, s0 + dt * 3.6));
    let dh = pl.heading - astro.g.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    astro.g.rotation.y += dh * Math.min(1, dt * 14);
    const walking = phase === "play" && pl.moving && pl.eject <= 0;
    pl.walk += dt * (walking ? 8 : 0);
    pl.gait = (pl.gait || 0) + ((walking ? 1 : 0) - (pl.gait || 0)) * Math.min(1, dt * 10);   // 2d: vào/ra dáng đi mềm (không giật chân về 0)
    const sw = Math.sin(pl.walk) * 0.34 * pl.gait, cw = Math.cos(pl.walk);
    astro.legs[0].rotation.x = sw; astro.legs[1].rotation.x = -sw;
    astro.arms[0].rotation.x = -sw * 0.7; astro.arms[1].rotation.x = sw * 0.7;
    // 2d: KHÔNG còn nhấp nhô/lơ lửng — chân đang đưa ra trước (góc hông đang giảm) nhấc lên một chút, chân trụ chạm boong; thân tính theo đế thấp nhất
    plantFeet(astro, [0.07 * Math.max(0, -cw) * pl.gait, 0.07 * Math.max(0, cw) * pl.gait]);
    // 2j: bàn chân chạm boong = lúc cw đổi dấu (chân trái hạ khi cw thành dương, chân phải khi thành âm) ⇒ 1 tiếng bước kim loại khẽ
    if (walking && pl.gait > 0.5 && astro.g.visible && !pl.lift) { const sg = cw >= 0; if (pl.cwS !== undefined && sg !== pl.cwS) sfx.step(sg ? 0 : 1, fight ? 0.75 : 1); pl.cwS = sg; } else pl.cwS = undefined;
    astro.jets.forEach(j => { j.material.emissiveIntensity = pl.fly > 0 ? 6 : walking ? 3 : 0.4; });
    astro.arms[0].rotation.z = 0; astro.arms[1].rotation.z = 0; astro.arms[0].rotation.y = 0; astro.elbows[0].rotation.set(0, 0, 0); astro.elbows[1].rotation.set(0, 0, 0);
    if (pl.bounce && pl.moving) { astro.body.position.y = Math.sin(pl.t * Math.PI) * 0.9; astro.body.rotation.x = -0.35 * Math.sin(pl.t * Math.PI); }
    else astro.body.rotation.x *= 0.8;
    if (pl.salute) {                                      // 1h/1i: đứng nghiêm, quay mặt ra khán giả, TAY PHẢI CHÀO — giữ tới khi hạ xuống boong
      const k = gameT - pl.saluteT, w = ease(clamp((k - 0.12) / 0.3, 0, 1));
      astro.legs[0].rotation.x = astro.legs[1].rotation.x = 0;
      astro.arms[1].rotation.x = 0; astro.arms[1].rotation.z = 0.06;                                   // tay trái duỗi sát người
      astro.arms[0].rotation.x = SALUTE.sx * w; astro.arms[0].rotation.z = SALUTE.sz * w; astro.arms[0].rotation.y = SALUTE.sy * w;
      astro.elbows[0].rotation.x = SALUTE.ex * w; astro.elbows[0].rotation.z = SALUTE.ez * w;
      astro.body.position.y = 0; astro.body.rotation.x = 0;
    }
    if (pl.leave > 0) {                                   // tia sáng đưa người đi trước khi mê cung sụp
      pl.leave -= dt; const u = clamp(1 - pl.leave / 0.6, 0, 1);
      astro.g.scale.setScalar(Math.max(0.001, 1.75 * (1 - u))); astro.body.position.y = u * 4;
      if (pl.leave <= 0) astro.g.visible = false;
    }
    if (pl.hurt === "red" && pl.down) {                   // 1h: bị đụng — giữ nguyên hình · 2b: KHÔNG giật/giơ tay/nảy — đứng yên, chỉ ĐỎ NHẤP NHÁY NHẸ
      pl.redT = (pl.redT || 0) + dt;
      astro.setRed(0.55 + 0.45 * (0.5 + 0.5 * Math.cos(pl.redT * 9)));
      astro.legs[0].rotation.x = astro.legs[1].rotation.x = 0; astro.arms[0].rotation.x = astro.arms[1].rotation.x = 0;
      astro.body.position.y = 0; astro.body.rotation.set(0, 0, 0);
    } else if (pl.hurt === "blast" && pl.down) {          // 1i: 0–0,1 s lửa nổ bùng TRƯỚC · 0,1–0,22 s robot bị hất vọt lên · rồi VỠ từ chính hình robot
      pl.blastT += dt; const bt = pl.blastT;
      if (bt > 0.04 && astro.g.visible) {                     // 1m: KHÔNG nảy lên — vừa nổ là thân robot tan thành đốm sáng ngay tại chỗ
        const u = 1;
        if (u >= 1) {
          const [bx, bz] = entityPos(pl);
          const bp = astroBodyPoints(astro); astro.g.visible = false; boom.fireflies(bx, bz, { n: 420, pts: bp.pts, center: bp.center, hold: 0.07 });   // 1j: đom đóm · 1l: từ CHÍNH thân robot
          burst(bx, 2.4, bz, 0xff9a3c, 60, 8, 6, 0.8); sfx.robotBoom(true);   /* 2j: nổ thật */
        }
      }
    } else { astro.body.rotation.y *= 0.8; astro.body.rotation.z *= 0.8; }
  }
  function update(dt) {
    if (paused) return;
    gameT += dt;
    for (let i = 0; i < jobs.length; i++) { if (jobs[i].at <= gameT) { const j = jobs.splice(i--, 1)[0]; j.fn(); } }
    if (intro && (phase === "cine" || phase === "menu" || intro.tailing)) intro.update(dt);   // 1o: intro điện ảnh · 1p: + màn chờ · 1r: + đoạn lùi máy quay sau khi câu hỏi hiện
    if (phase !== "menu" && phase !== "end") { playT += dt;   // 2d: Timer như AWord — Count up / Count down (hết giờ ⇒ kết thúc) / None (ẩn đồng hồ)
      if (opt.timer === "down") { const left = Math.max(0, opt.timerSec - playT); ledSet(clockEl, fmt(Math.ceil(left))); if (left <= 0 && phase !== "cine") endGame("time"); }
      else ledSet(clockEl, fmt(playT)); }   // 2b: cả đơn lẫn Fight = LED 7 thanh   // 1v: Fight ⇒ LED 7 thanh

    // tường
    if (wallAnim.dir !== 0 && wallAnim.t < 3) { wallAnim.t += dt; paintWalls(); }
    tickAlarm(dt);   /* 2f: đèn báo động */

    // người chơi
    if (pl.eject > 0) pl.eject -= dt;                       // 1e: văng người chạy cả lúc đang chờ đổi người
    if (pl2.eject > 0) pl2.eject -= dt;
    if (phase === "swap" && pl.bounce && pl.moving) moveEntity(pl, dt, () => null, () => { pl.bounce = false; return false; });
    if (phase === "play") {
      for (const T of (fight ? teams : [teams[0]])) {          // 1u: Fight ⇒ cả hai đội tự di chuyển
        const p = T.pl;
        if (phase !== "play") break;
        if (fight && T.status !== "in") continue;
        if (p.eject > 0 || p.lift < -0.05 || p.warp) { /* đang văng / đang được nâng lên / 1y: đang qua cổng */ }
        else {
          moveEntity(p, dt, decidePlayer, () => checkPad(T));   /* 2j: tiếng bước chuyển sang animRobot (đúng lúc bàn chân chạm boong) */   // 2b: cổng không còn bắt ở lúc tới ô — xem decidePlayer
          if (p.moving) p.heading = Math.atan2(DIRS[p.dir].dc, DIRS[p.dir].dr);
        }
      }
      for (const e of ens) {
        if (gameT < e.born + 0.4 || e.hold || (e.lift || 0) < -0.3) continue;
        moveEntity(e, dt, decideEnemy, () => true);
        if (e.moving) e.heading = Math.atan2(DIRS[e.dir].dc, DIRS[e.dir].dr);
      }
      for (const b of bombs) {                                // 1s: robot địch CHẠM bom (tâm cách tâm ô bom < 0,3 ô) mới nổ
        if (b.gone) continue; const bx = cellX(b.c), bz = cellZ(b.r);
        if (ens.some(e => { if (e.hold || (e.lift || 0) < -0.3) return false; const [x, z] = entityPos(e); return Math.hypot(x - bx, z - bz) < CELL * 0.3; })) detonate(b);
      }
      if (fight) {                                              // 1u: địch chạm đội nào thì đội đó mất tim
        for (const T of teams) {
          if (phase !== "play" || T.status !== "in" || T.pl.eject > 0 || T.pl.warp || T.pl.lift < -0.5 || gameT <= T.grace || gameT <= T.invuln) continue;
          const [px, pz] = entityPos(T.pl);
          if (ens.some(e => { if (e.hold || (e.lift || 0) < -1) return false; const [x, z] = entityPos(e); return Math.hypot(x - px, z - pz) < CELL * 0.55; })) hitTeam(T, "enemy");
        }
      } else if (phase === "play" && pl.eject <= 0 && !pl.warp && gameT > graceUntil && gameT > invulnUntil) {
        const [px, pz] = entityPos(pl);
        if (ens.some(e => { if (e.hold || (e.lift || 0) < -1) return false; const [x, z] = entityPos(e); return Math.hypot(x - px, z - pz) < CELL * 0.55; })) hitByEnemy();
      }
    }

    (fight ? teams : [teams[0]]).forEach(T => tickWarp(T, dt)); paintGateReady();
    if (!robotFree) { animRobot(pl, astro, dt); if (fight || ROBOTS > 1) animRobot(pl2, astro2, dt); }
    teams.forEach(T => { const w = T.pl.warp; if (!w) return;                     // 1y: co lại + xoáy khi vào cổng, bung ra ở cổng kia
      const k = w.t < WARP_IN ? 1 - w.t / WARP_IN : Math.min(1, (w.t - WARP_IN) / WARP_OUT), e = k * k * (3 - 2 * k);   // 2b: thời lượng mới
      T.astro.g.scale.setScalar(Math.max(0.001, 1.75 * e)); T.astro.body.rotation.y = (1 - e) * 9; T.astro.g.position.y += (1 - e) * 1.2; });   // 1p: intro đang lái robot bay ⇒ không đè dáng · 1u: + robot đội B
    const inv = gameT < invulnUntil || (phase === "play" && gameT < graceUntil);
    const left = graceUntil - gameT;                          // 1h: hào quang dịu nhịp thở; 0,8 s cuối nháy báo sắp hết
    shield.visible = astro.g.visible && inv && !pl.down && pl.lift > -0.5 && (phase !== "play" || left > 0.8 || Math.sin(gameT * 32) > 0);
    if (fight) {                                              // 1u: hào quang theo đội (grace từng đội)
      teams.forEach(T => {
        const inT = gameT < T.invuln || (phase === "play" && gameT < T.grace), leftT = T.grace - gameT, sh = T.shield;
        sh.visible = T.astro.g.visible && inT && !T.pl.down && T.pl.lift > -0.5 && (phase !== "play" || leftT > 0.8 || Math.sin(gameT * 32) > 0);
        if (sh.visible) { const f = 0.8 + 0.25 * Math.sin(gameT * 5), c = T.meta.sh; sh.material.uniforms.uColor.value.setRGB(c[0] * f, c[1] * f, c[2] * f); sh.scale.setScalar(1 + 0.04 * Math.sin(gameT * 5)); }
      });
    } else if (shield.visible) { const f = 0.8 + 0.25 * Math.sin(gameT * 5); shield.material.uniforms.uColor.value.setRGB(0.49 * f, 0.83 * f, 0.99 * f); shield.scale.setScalar(1 + 0.04 * Math.sin(gameT * 5)); }
    if (tpBeam.visible) { tpBeam.userData.t += dt; const u = tpBeam.userData.t / 0.8; tpBeam.material.uniforms.uOpacity.value = Math.max(0, 1 - u); tpBeam.material.uniforms.uTime.value = gameT; if (u >= 1) tpBeam.visible = false; }

    // địch
    for (const e of ens) {
      let [x, z] = e.hold || entityPos(e), lift = e.lift || 0; const g = e.drone.g;
      if (e.fly) {                                           // 1e: bay vòng lên rồi đáp xuống góc xuất phát
        e.fly.t += dt / 1.1; const u = Math.min(1, e.fly.t), k = ease(u);
        x = e.fly.from[0] + (x - e.fly.from[0]) * k; z = e.fly.from[1] + (z - e.fly.from[1]) * k; lift = Math.sin(u * Math.PI) * 4;
        if (u >= 1) e.fly = null;
      }
      g.position.set(x, 1.45 + lift + Math.sin(gameT * 3 + e.born) * 0.14, z);
      const sc = g.scale.x; if (gameT > e.born && sc < 1.6) g.scale.setScalar(Math.min(1.6, sc + dt * 3.6));
      let d = e.heading - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 8);
      e.drone.body.rotation.z = Math.sin(gameT * 4 + e.born) * 0.08;
      e.drone.flame.scale.set(1, 0.8 + Math.random() * 0.45, 1);
      e.drone.arms.forEach((a, k) => { a.rotation.x = Math.sin(gameT * 3 + k * 1.7 + e.born) * 0.35; });
      e.drone.tip.material.emissiveIntensity = Math.sin(gameT * 6 + e.born) > 0 ? 3.5 : 0.8;
    }

    // bệ
    for (const p of pads) {
      const age = gameT - (p.bornT ?? (p.bornT = gameT)) - p.born;
      let s = clamp(age / 0.45, 0, 1); s = s > 0 ? easeOutBack(s) : 0.001;
      if (p.fade >= 0) { p.fade += dt; const u = clamp(p.fade / 0.45, 0, 1); s *= 1 - u; if (u >= 1) p.g.visible = false; }
      p.g.scale.setScalar(Math.max(0.001, s));
      p.beamMat.uniforms.uTime.value = gameT;
      p.sign.position.y = SIGN_Y + Math.sin(gameT * 1.8 + p.c) * 0.08;
      p.sign.quaternion.copy(camera.quaternion);                       // bảng luôn quay mặt về máy quay
      if (p.flip >= 0) { p.flip += dt; const u = clamp(p.flip / 0.6, 0, 1); p.sign.rotateZ(Math.sin(u * Math.PI * 3) * 0.08 * (1 - u)); p.sign.scale.setScalar(1 + Math.sin(u * Math.PI) * 0.22); }   // nảy phồng (lật 360° làm chữ ngược giữa chừng)
      if (p.shake >= 0) { p.shake += dt; p.sign.position.x = Math.sin(p.shake * 50) * 0.25 * Math.max(0, 1 - p.shake / 0.5); }
      p.beamMat.uniforms.uOpacity.value = (p.state === "idle" ? 0.2 : 0.55) + Math.sin(gameT * 3 + p.c) * 0.04;
    }

    wings.forEach(w => { w.pivot.rotation.x = w.s * 0.12 + 0.07 * Math.sin(gameT * 0.23 + w.ph) + 0.035 * Math.sin(gameT * 0.071 + w.ph * 2.3); });   // 1x: cánh pin dò nắng — xoay rất chậm, nhẹ
    beacons.forEach(b => { b.m.material.emissiveIntensity = (Math.sin(gameT * 3 + b.ph) > 0.6) ? 4 : 0.3; });
    sky.material.uniforms.uTime.value = gameT;
    planet.rotation.y += dt * 0.01; station.rotation.y = 0;
    // 1i: sao xoay tròn rất chậm quanh trục nhìn của máy quay; tinh vân xoay chậm hơn, trục lệch ~12° ⇒ hai lớp trượt lệch nhau
    if (!skyAxis && ++skyN > 5) { skyAxis = new THREE.Vector3(); camera.getWorldDirection(skyAxis); skyAxis2 = skyAxis.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.21).normalize(); }
    if (skyAxis) {
      starLayers[0].quaternion.setFromAxisAngle(skyAxis, gameT * 0.012); starLayers.forEach(l => l.quaternion.copy(starLayers[0].quaternion));
      sky.material.uniforms.uRot.value.setFromMatrix4(new THREE.Matrix4().makeRotationAxis(skyAxis2, -gameT * 0.0075));
    }
    starU.uTime.value = gameT;
    hatches.update(dt, gameT); gates.update(dt, gameT); ship.update(dt, gameT); if (hatches.busy) underdeck.update(dt, gameT);
    startRing.rotation.y -= dt * 0.6;
    updateParts(dt);
    boom.update(dt);
    for (const b of bombs) {                                 // 1e: bom rơi xuống + ngòi lấp lánh + đèn đỏ + vòng cảnh báo
      if (b.gone) continue;
      b.t += dt; b.obj.g.scale.setScalar(1.25 * Math.min(1, easeOutBack(Math.min(1, b.t / 0.35))));
      paintFuse(b);
      if (phase === "play" && Math.floor(b.t) > b.sec) { b.sec = Math.floor(b.t); sfx.tick(); }
      if (b.t >= FUSE_S) { if (phase === "play" || phase === "swap" || phase === "hold") detonate(b); continue; }   // 1h: hết 5 s tự nổ
      b.obj.spark.scale.setScalar(0.45 + Math.random() * 0.35); b.obj.spark.material.opacity = 0.7 + Math.random() * 0.3;
      b.obj.led.material.emissiveIntensity = Math.sin(gameT * 8) > 0 ? 4 : 0.3;
      b.obj.warn.material.opacity = 0.25 + 0.25 * (0.5 + 0.5 * Math.sin(gameT * 5));
    }
    updateCamera(dt);
  }
  // 2d: vật liệu TRONG SUỐT + HAI MẶT ⇒ three.js tự vẽ 2 lượt (mặt sau rồi mặt trước) và mỗi lượt đặt needsUpdate ⇒ tính lại tham số shader
  //     mỗi khung (bảng chữ đáp án, cột sáng, quầng…). Bật forceSinglePass cho mọi vật liệu như vậy (quét lại mỗi ~0,5 s cho vật mới sinh).
  let singleScan = 0;
  function forceSingle() { scene.traverse(o => { const m = o.material; if (!m) return; (Array.isArray(m) ? m : [m]).forEach(x => { if (x.transparent && x.side === THREE.DoubleSide && !x.forceSinglePass) x.forceSinglePass = true; }); }); }
  function render() { if (--singleScan <= 0) { singleScan = 30; forceSingle(); } portalDue = portal.active; composer.render(); portalDue = false; drawMini(); }   // 2d: ảnh hầm vẽ lồng trong lượt chính (portalHook)

  // ---------------------------------------------------------------- điều khiển
  const KEYS = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", w: "u", s: "d", a: "l", d: "r", W: "u", S: "d", A: "l", D: "r" };
  on(window, "keydown", e => {   /* 2n: on() ⇒ destroy() gỡ */
    if (e.key === "Escape") { if (!ovAgain.hidden) return; setPaused(!paused); return; }   /* 2j: đang chờ START AGAIN ⇒ không bỏ dừng */
    if (fight) {                                              // 1u: đội A = WASD + F · đội B = mũi tên + Enter
      if (paused) return;
      const lk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (lk === "f") { e.preventDefault(); placeBomb(teams[0]); return; }
      if (lk === "Enter") { e.preventDefault(); placeBomb(teams[1]); return; }
      const kA = { w: "u", s: "d", a: "l", d: "r" }[lk], kB = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r" }[lk];
      const k = kA || kB; if (!k) return;
      e.preventDefault(); const T = kA ? teams[0] : teams[1];
      const g = screenToGrid(...SCREEN_VEC[k], T.pl); if (g) queueDir(g, T.pl);
      return;
    }
    if ((e.key === " " || e.key === "b" || e.key === "B") && !paused) { e.preventDefault(); placeBomb(); return; }
    const k = KEYS[e.key]; if (!k || paused) return;
    e.preventDefault();
    const g = screenToGrid(...SCREEN_VEC[k]); if (g) queueDir(g);
  });
  const dpTeam = dp => fight && dp === dpads.r ? teams[1] : teams[0];   // 1u: D-pad phải = đội B (chỉ ở Fight)
  Object.values(dpads).forEach(dp => dp.querySelectorAll("button, .ring .w").forEach(b => {   // 1f: + 4 múi SVG của Ring
    b.addEventListener("pointerdown", e => {
      e.preventDefault(); e.stopPropagation(); if (paused) return;
      const T = dpTeam(dp);
      if (b.dataset.bomb) { placeBomb(T); b.classList.add("is-on"); setTimeout(() => b.classList.remove("is-on"), 160); return; }   // 1e: nút giữa = BOM
      const g = screenToGrid(...SCREEN_VEC[b.dataset.d], T.pl); if (g) queueDir(g, T.pl);
      b.classList.add("is-on"); setTimeout(() => b.classList.remove("is-on"), 140);
    });
  }));
  // kiểu E "stick": kéo núm (hoặc chạm vào mép đế) — đổi hướng khi núm lệch quá 25% bán kính
  Object.values(dpads).forEach(dp => {
    const knob = dp.querySelector(".knob"); let drag = null, lastDir = null;
    const moveTo = e => {
      const r = dp.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R0 = r.width / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy; const L = Math.hypot(dx, dy), m = R0 * 0.42;
      if (L > m) { dx *= m / L; dy *= m / L; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      if (L < R0 * 0.25) return;
      const sd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : (dy > 0 ? "d" : "u");
      if (sd !== lastDir) { lastDir = sd; const T = dpTeam(dp), g = screenToGrid(...SCREEN_VEC[sd], T.pl); if (g) queueDir(g, T.pl); }
    };
    dp.addEventListener("pointerdown", e => {
      if (dp.dataset.style !== "stick" || paused) return;
      e.preventDefault(); drag = e.pointerId; lastDir = null; dp.classList.add("is-drag"); try { dp.setPointerCapture(e.pointerId); } catch (_) { /* ảo */ } moveTo(e);
    });
    dp.addEventListener("pointermove", e => { if (drag === e.pointerId) moveTo(e); });
    const end = e => { if (drag !== e.pointerId) return; drag = null; dp.classList.remove("is-drag"); knob.style.transform = ""; };
    dp.addEventListener("pointerup", end); dp.addEventListener("pointercancel", end);
  });
  // 2q: iPAD LÀM D-PAD — đường nối (remote) gọi press(team, key) ⇒ y như bấm D-pad trên màn của đội đó
  const padSt = ["", ""], padTags = [$(".mc-padtag.is-l"), $(".mc-padtag.is-r")];
  const PAD_TXT = { on: "iPad", relay: "iPad · slow", wait: "iPad …" };
  function paintPadTags(on = phase !== "menu" && phase !== "end" && phase !== "cine") {
    padTags.forEach((el, i) => {
      const st = padSt[i], show = !!st && (i === 0 || fight) && on;
      el.hidden = !show; el.dataset.s = st; el.querySelector("b").textContent = PAD_TXT[st] || "";
    });
    $$(".mc-tablet").classList.toggle("is-on", padSt.some(st => st === "on" || st === "relay"));
  }
  function flashBtn(el, ms) { if (!el) return; el.classList.add("is-on"); clearTimeout(el._padT); el._padT = setTimeout(() => el.classList.remove("is-on"), ms); }
  function remotePress(t, key) {
    if (dead || paused) return;
    t = t ? 1 : 0;
    if (t === 1 && !fight) return;                          // Single: chỉ iPad đội A lái
    const T = teams[t], dp = t ? dpads.r : dpads.l;
    if (key === "bomb") { placeBomb(T); flashBtn(dp.querySelector(".hub"), 160); return; }
    if (!SCREEN_VEC[key]) return;
    const g = screenToGrid(...SCREEN_VEC[key], T.pl); if (g) queueDir(g, T.pl);
    dp.querySelectorAll(`[data-d="${key}"]`).forEach(b => flashBtn(b, 140));
  }
  // chạm / vuốt trên màn (chơi đơn): vuốt ⇒ theo hướng vuốt; chạm ⇒ theo phía chỗ chạm so với nhân vật
  let touch = null;
  canvas.addEventListener("pointerdown", e => {
    if (fight || (phase !== "play" && phase !== "count")) return;   // 1u: Fight KHÔNG chạm/vuốt (hai bên vuốt đè nhau)
    const r = stage.getBoundingClientRect();
    touch = { x: e.clientX - r.left, y: e.clientY - r.top, used: false, id: e.pointerId };
  });
  canvas.addEventListener("pointermove", e => {
    if (!touch || touch.used || e.pointerId !== touch.id) return;
    const r = stage.getBoundingClientRect(), dx = e.clientX - r.left - touch.x, dy = e.clientY - r.top - touch.y;
    if (Math.hypot(dx, dy) > stageW * 0.035) { touch.used = true; const g = screenToGrid(dx, dy); if (g) queueDir(g); }
  });
  canvas.addEventListener("pointerup", e => {
    if (!touch || e.pointerId !== touch.id) return;
    const t = touch; touch = null;
    if (t.used) return;
    const [sx, sy] = playerScreen(), dx = t.x - sx, dy = t.y - sy;
    if (Math.hypot(dx, dy) < stageW * 0.02) return;
    const g = screenToGrid(dx, dy); if (g) queueDir(g);
  });
  canvas.addEventListener("pointercancel", () => { touch = null; });

  // ---------------------------------------------------------------- nút
  // 2d: bảng OPTIONS đúng kiểu AWord (core/options-panel.js + app.css): nền trắng, 2 cột, nhãn chữ hoa xám, thanh chọn viên thuốc, thanh trượt màu
  //     + số, ô tick; sửa trên BẢN NHÁP, bấm Apply mới áp dụng (bấm ra ngoài = bỏ). Nhóm xanh lá trên cùng: Mode + Timer.
  let draft = null;
  const SL = { lives: { lab: "Lives", min: 1, max: 9, tone: "green", chip: v => v },
    difficulty: { lab: "Difficulty", sub: "enemies", min: 1, max: 10, tone: "blue", chip: v => v + "/10" },
    bombs: { lab: "Bombs", sub: "each player", min: 0, max: 10, tone: "amber", chip: v => v ? v : "Off", off: 0 },
    bombGift: { lab: "Bomb gift", sub: "every N correct", min: 0, max: 10, tone: "amber", chip: v => v ? v : "Off", off: 0 } };
  const segHtml = (k, items, cur, dim) => `<div class="mco-seg${dim ? " is-dim" : ""}" data-seg="${k}" style="--n:${items.length};--i:${Math.max(0, items.findIndex(it => it[0] === cur))}"><div class="mco-seg-thumb"></div>${
    items.map(([v, t]) => `<button class="mco-seg-btn${v === cur ? " is-on" : ""}" data-v="${v}">${t}</button>`).join("")}</div>`;
  function sliderHtml(k) { const d = SL[k], v = draft[k];
    return `<div class="mco-optc"><div class="mco-optc-lab">${d.lab}${d.sub ? `<span class="mco-optc-sub">${d.sub}</span>` : ""}</div><div class="mco-optc-ctl">
      <input type="range" class="mco-optc-slider is-${d.tone}" data-sl="${k}" min="${d.min}" max="${d.max}" step="1" value="${v}" style="--mco-slider-fill:${((v - d.min) / (d.max - d.min) * 100).toFixed(1)}%">
      <span class="mco-optc-chip is-${d.tone}${d.off === v ? " is-off" : ""}">${d.chip(v)}</span></div></div>`; }
  const checkHtml = (k, t) => `<label class="mco-check"><input type="checkbox" class="mco-check-in" data-ck="${k}"${draft[k] ? " checked" : ""}><span class="mco-check-box"></span><span class="mco-check-t">${t}</span></label>`;
  function buildOpts() {
    const menu = phase === "menu";
    optsEl.innerHTML = `<div class="mco-opt-grid">
      <div class="mco-optc mco-optc-wide mco-opt-top"><div class="mco-optc-lab">Mode${menu || phase === "end" ? (phase === "end" ? `<span class="mco-optc-sub">change on the start screen</span>` : "") : `<span class="mco-optc-sub">Apply = start again</span>`}</div>
        <div class="mco-optc-ctl">${segHtml("fight", [[false, "Single"], [true, "Fight · 2 teams"]], !!draft.fight, phase === "end")}</div></div>
      <div class="mco-optc mco-optc-wide mco-opt-top"><div class="mco-optc-ctl">${segHtml("timer", [["none", "None"], ["up", "Count up"], ["down", "Count down"]], draft.timer)}
        <div class="mco-tstep${draft.timer === "down" ? "" : " is-dim"}"><button data-ts="-1">−</button><b>${fmt(draft.timerSec)}</b><button data-ts="1">+</button></div></div></div>
      <div class="mco-optc-dash"></div>
      ${sliderHtml("lives")}${sliderHtml("difficulty")}${sliderHtml("bombs")}${sliderHtml("bombGift")}
      <div class="mco-optc mco-optc-wide"><div class="mco-optc-lab">D-pad style</div><div class="mco-optc-ctl">${segHtml("dpadStyle", DPAD_STYLES.map(k => [k, DPAD_STYLE_NAMES[k].split("· ")[1]]), draft.dpadStyle)}</div></div>
      <div class="mco-optc-sep"></div>
      <div class="mco-optc mco-optc-wide"><div class="mco-checks">${checkHtml("shuffle", "Shuffle questions")}${checkHtml("showAnswers", "Show answers at end")}</div></div>
    </div>
    <div class="mco-opt-foot"><button class="mco-opt-apply${JSON.stringify(draft) === JSON.stringify(pickOpt(opt)) ? " is-dim" : ""}">Apply</button></div>`;
    optsEl.querySelectorAll(".mco-seg-btn").forEach(b => b.addEventListener("click", () => {
      const k = b.parentNode.dataset.seg, raw = b.dataset.v; draft[k] = k === "fight" ? raw === "true" : raw; sfx.click(); buildOpts(); }));
    optsEl.querySelectorAll("[data-sl]").forEach(inp => inp.addEventListener("input", () => {
      const k = inp.dataset.sl, d = SL[k]; draft[k] = +inp.value; inp.style.setProperty("--mco-slider-fill", ((draft[k] - d.min) / (d.max - d.min) * 100).toFixed(1) + "%");
      const ch = inp.nextElementSibling; ch.textContent = d.chip(draft[k]); ch.classList.toggle("is-off", d.off === draft[k]); dimApply(); }));
    optsEl.querySelectorAll("[data-ts]").forEach(b => b.addEventListener("click", () => {
      draft.timerSec = clamp(draft.timerSec + 15 * (+b.dataset.ts), 15, 3599); sfx.click(); buildOpts(); }));
    optsEl.querySelectorAll("[data-ck]").forEach(inp => inp.addEventListener("change", () => { draft[inp.dataset.ck] = inp.checked; sfx.click(); dimApply(); }));
    optsEl.querySelector(".mco-opt-apply").addEventListener("click", applyOpts);
  }
  const saveOpts = () => { if (host && host.saveOptions) { try { host.saveOptions(pickOpt(opt)); } catch (e) { console.warn("STAR LOOT: save options", e); } } };   // 2n
  const OPT_KEYS = ["fight", "timer", "timerSec", "lives", "difficulty", "bombs", "bombGift", "dpadStyle", "shuffle", "showAnswers"];
  const pickOpt = o => Object.fromEntries(OPT_KEYS.map(k => [k, o[k]]));
  const dimApply = () => { const a = optsEl.querySelector(".mco-opt-apply"); if (a) a.classList.toggle("is-dim", JSON.stringify(draft) === JSON.stringify(pickOpt(opt))); };
  function applyOpts() { applyFrom(draft, true); }
  // 2o: áp một bộ Options (bảng riêng: save = true · bảng AWord qua api.setOptions: AWord đã lưu ⇒ save = false)
  function applyFrom(d, save) {
    const wasFight = !!opt.fight, midGame = phase !== "menu" && phase !== "end";   /* 2j */
    Object.assign(opt, d);
    if (phase === "end") opt.fight = wasFight;
    if (save) saveOpts();                                            // 2n: AWord lưu Options theo act                        // màn kết quả: đổi chế độ ở màn chờ (2j: giữa ván đổi được vì chơi lại từ đầu)
    if (!!opt.fight !== wasFight && !midGame) setFightMode(!!opt.fight);
    clockWrap.hidden = opt.timer === "none";
    paintHow(); sfx.click();
    if (midGame) { panelPaused = false; closePanel(); paused = true; ovPause.hidden = true; ovAgain.hidden = false; return; }   // 2j: ván đứng yên, chỉ còn START AGAIN
    applyDpad(); closePanel();
  }
  const ovAgain = $(".mc-ov-again");
  $(".mc-again2").addEventListener("click", () => {                  // 2j: chơi lại NGAY với Options mới — không intro
    ovAgain.hidden = true; paused = false; jobs = []; countEl.hidden = true; swapEl.hidden = true; bigq.hidden = true; bigq.classList.remove("is-fly"); qEl.classList.remove("is-wait");
    setAlarm(false); introWallsUp = false; enemiesUp = false; cineCam = null;
    sfx.resume(); startGame();
  });
  function paintOpts() { if (draft && ovPanel && ovPanel.dataset.kind === "options") { draft.fight = !!opt.fight; buildOpts(); } clockWrap.hidden = opt.timer === "none"; }
  const paintHow = () => { $(".mc-how").textContent = opt.fight ? "FIGHT: two teams race to the right word — bombs hurt everyone!" : "Grab the right word from the enemy base — avoid the enemy robots!"; };
  paintHow();
  $(".mc-go").addEventListener("click", () => beginIntro());   // 1o/1p: START ở màn chờ ⇒ intro cốt truyện rồi vào game
  $(".mc-again").addEventListener("click", startGame);
  $(".mc-restart").addEventListener("click", () => { setPaused(false); jobs = []; startGame(); });
  $(".mc-resume").addEventListener("click", () => setPaused(false));
  $(".mc-endgame").addEventListener("click", () => {                  // 1m: kết thúc ván ngay ⇒ màn kết quả (câu chưa chơi ghi "chưa chơi")
    if (phase === "menu" || phase === "end") return;
    if (phase === "cine") { setPaused(false); intro.abort(); cineCam = null; toMenu(); return; }   // 1o: đang intro ⇒ về màn chờ (1p: thiên hà)
    setPaused(false); jobs = []; countEl.hidden = true; swapEl.hidden = true; bigq.hidden = true; bigq.classList.remove("is-fly"); qEl.classList.remove("is-wait");
    if (intro && (intro.active || intro.tailing)) intro.abort(); cineCam = null; toMenu();   // 1x: thầy — END GAME về màn START ban đầu
  });
  $$(".mc-menu").addEventListener("click", () => {
    // 2n: AWord — ở màn START / màn kết quả không có gì để dừng ⇒ Menu mở bảng Library + Change template (không thì kẹt, không về được thư viện)
    if (host && (phase === "menu" || phase === "end")) { ovPanel.dataset.kind === "tpl" && !ovPanel.hidden ? closePanel() : openPanel("tpl"); return; }
    setPaused(true);
  });
  // 2n: AWord — Menu có thêm Change template (act từ vựng chơi bằng game khác) + Library (về thư viện)
  if (host) {
    const row = $(".mc-hostrow"), tl = host.templates ? host.templates() : [];
    $(".mc-chtpl").hidden = !(tl && tl.length); $(".mc-lib").hidden = !host.home;
    row.hidden = $(".mc-chtpl").hidden && $(".mc-lib").hidden;
    $(".mc-chtpl").addEventListener("click", () => openPanel("tpl"));
    $(".mc-lib").addEventListener("click", () => { sfx.click(); host.home(); });
  }
  $(".mc-showans").addEventListener("click", () => {                   // 1m: mở ⇒ khung phóng to tối đa
    const a = $(".mc-ans"); a.hidden = !a.hidden;
    $(".mc-ov-end .mc-card").classList.toggle("is-ans", !a.hidden); $(".mc-showans").textContent = a.hidden ? "Show answers" : "Hide answers";
  });
  const sBtn = $$(".mc-sound");
  // 2j: như Rocket Race — bấm loa ⇒ bảng nhỏ 2 công tắc EFFECTS / BACKGROUND ngay trên nút (nhớ theo máy); tắt cả hai ⇒ icon loa gạch
  let sndPop = null;
  const paintSnd = () => { const p = sfx.prefs, off = !p.fx && !p.bg; sBtn.classList.toggle("is-off", off); sBtn.classList.toggle("is-half", !off && (!p.fx || !p.bg)); };
  const closeSnd = () => { if (sndPop) { sndPop.remove(); sndPop = null; } };
  function openSnd() {
    closeSnd(); sndPop = document.createElement("div"); sndPop.className = "mc-sndmenu";
    [["fx", "EFFECTS"], ["bg", "BACKGROUND"]].forEach(([k, label]) => {
      const row = document.createElement("button"); row.type = "button"; row.className = "mc-sndrow" + (sfx.prefs[k] ? " is-on" : "");
      row.innerHTML = `<span>${label}</span><i class="mc-switch"></i>`;
      row.addEventListener("click", e => { e.stopPropagation(); sfx.setPrefs({ [k]: !sfx.prefs[k] }); row.classList.toggle("is-on", sfx.prefs[k]); paintSnd(); sfx.click(); });
      sndPop.append(row);
    });
    document.body.append(sndPop);
    const br = sBtn.getBoundingClientRect(), pw = sndPop.offsetWidth, ph = sndPop.offsetHeight;
    sndPop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, br.left + br.width / 2 - pw / 2)) + "px";
    sndPop.style.top = Math.max(8, br.top - ph - 10) + "px";
  }
  sBtn.addEventListener("click", e => { e.stopPropagation(); sfx.unlock(); if (sndPop) closeSnd(); else openSnd(); });
  on(document, "pointerdown", e => { if (sndPop && !sndPop.contains(e.target) && !sBtn.contains(e.target)) closeSnd(); }, true);
  paintSnd();
  // 1g: bảng nổi cho 4 nút hệ AWord — mở giữa ván thì tạm dừng, đóng thì chơi tiếp
  const ovPanel = $$(".mc-ov-panel"), pnT = $$(".mc-pn-t"), pnB = $$(".mc-pn-b"), optsEl = $(".mc-opts"), optsHome = optsEl.parentNode;
  let panelPaused = false, folderTok = 0;
  function openPanel(kind) {
    if (!ovPanel.hidden) closePanel();
    if (phase !== "menu" && phase !== "end" && !paused) { paused = true; panelPaused = true; sfx.suspend(); }
    pnB.innerHTML = ""; ovPanel.dataset.kind = kind;
    if (kind === "options") { pnT.textContent = "Options"; draft = pickOpt(opt); pnB.append(optsEl); optsEl.hidden = false; ovPanel.dataset.kind = kind; buildOpts(); }   // 2d: kiểu AWord
    else if (kind === "folder") {
      pnT.textContent = "Switch activity";
      if (host && host.listActs) {                                  // 2n: AWord — act THẬT cùng thư mục, bấm là mở act đó
        pnB.innerHTML = `<p class="mc-pn-note">Loading…</p>`;
        const tok = ++folderTok;
        Promise.resolve().then(() => host.listActs()).then(d => {
          if (tok !== folderTok || ovPanel.hidden || ovPanel.dataset.kind !== "folder") return;
          const groups = (d && d.groups) || [];
          if (d && d.folderName) pnT.textContent = d.folderName;
          pnB.innerHTML = groups.length ? `<div class="mc-pn-list">${groups.map(g => (g.path ? `<p class="mc-pn-grp">${escapeHtml(g.path)}</p>` : "") + g.acts.map(a =>
            `<button class="mc-pn-row${a.current ? " is-on" : ""}" data-id="${escapeHtml(String(a.id))}"${a.current ? " disabled" : ""}>${IC.folder}<span>${escapeHtml(a.title || "Untitled")}</span></button>`).join("")).join("")}</div>`
            : `<p class="mc-pn-note">No other activities in this folder.</p>`;
          pnB.querySelectorAll(".mc-pn-row[data-id]").forEach(b => b.addEventListener("click", () => { sfx.click(); host.openAct(b.dataset.id); }));
          pnB.querySelector(".mc-pn-row.is-on")?.scrollIntoView({ block: "nearest" });
        }).catch(() => { if (tok === folderTok) pnB.innerHTML = `<p class="mc-pn-note">Could not load the folder.</p>`; });
      } else {
        pnB.innerHTML = `<div class="mc-pn-list">${["Space words 1", "Space words 2", "Planets", "Solar system"].map((t, i) =>
          `<button class="mc-pn-row${i === 0 ? " is-on" : ""}">${IC.folder}<span>${t}</span></button>`).join("")}</div><p class="mc-pn-note">Sample list — in AWord this shows the activities in the same folder.</p>`;
      }
    } else if (kind === "tpl") {                                     // 2n: AWord — Menu ▸ Change template (act từ vựng chơi bằng game khác)
      const list = (host && host.templates ? host.templates() : []) || [], atMenu = phase === "menu" || phase === "end";
      pnT.textContent = atMenu ? "Menu" : "Change template";
      pnB.innerHTML = `<div class="mc-pn-list">${atMenu && host.home ? `<button class="mc-pn-row mc-pn-lib">${IC.folder}<span>Library</span></button>` : ""}${list.length ? `<p class="mc-pn-grp">Change template</p>` : ""}${list.map(t => `<button class="mc-pn-row" data-t="${escapeHtml(t.type)}">${IC.mode}<span>${escapeHtml(t.label)}</span></button>`).join("")}</div>`;
      pnB.querySelectorAll(".mc-pn-row[data-t]").forEach(b => b.addEventListener("click", () => { sfx.click(); host.switchTemplate(b.dataset.t); }));
      pnB.querySelector(".mc-pn-lib")?.addEventListener("click", () => { sfx.click(); host.home(); });
    } else if (kind === "tablet") {                                  // 2q: iPad làm D-pad — mã QR + trạng thái do đường nối vẽ
      pnT.textContent = "iPad D-pad";
      try { remote.panel(pnB, { fight }); } catch (e) { pnB.innerHTML = `<p class="mc-pn-note">iPad link is not available.</p>`; }
    } else if (kind === "mode") {
      pnT.textContent = "Mode";
      const can = phase === "menu";
      pnB.innerHTML = `<div class="mc-pn-modes"><button class="mc-pn-mode${opt.fight ? "" : " is-on"}" data-m="0"${can ? "" : " disabled"}>${IC.mode}<span>Single</span></button><button class="mc-pn-mode${opt.fight ? " is-on" : ""}" data-m="1"${can ? "" : " disabled"}>${IC.fight}<span>Fight</span><small>2 teams</small></button></div>${can ? "" : `<p class="mc-pn-note">Change the mode from the start screen.</p>`}`;
      pnB.querySelectorAll(".mc-pn-mode").forEach(b => b.addEventListener("click", () => { setFightMode(b.dataset.m === "1"); saveOpts(); paintOpts(); applyDpad(); paintHow(); sfx.click(); closePanel(); }));
    }
    ovPanel.hidden = false; sfx.unlock(); sfx.click();
  }
  function closePanel() {
    if (ovPanel.dataset.kind === "options") { optsHome.append(optsEl); optsEl.hidden = true; draft = null; }
    if (ovPanel.dataset.kind === "tablet") { try { remote.panelClosed && remote.panelClosed(); } catch (e) { /* bỏ qua */ } }   // 2q
    ovPanel.hidden = true; ovPanel.dataset.kind = "";
    if (panelPaused) { panelPaused = false; paused = false; sfx.resume(); }
  }
  // 1h: TABLET — nối iPad như Rocket Race; chức năng gán sau, tạm bật/tắt trạng thái nút
  const tabBtn = $$(".mc-tablet"); if (host && !remote) tabBtn.hidden = true;   // 2n: AWord — chưa có iPad cho STAR LOOT ⇒ ẩn nút mẫu · 2q: có đường nối iPad thì hiện
  tabBtn.addEventListener("click", () => {
    if (remote) { ovPanel.dataset.kind === "tablet" && !ovPanel.hidden ? closePanel() : openPanel("tablet"); return; }   // 2q: bảng QR nối iPad
    tabBtn.classList.toggle("is-on"); sfx.unlock(); sfx.click();
  });
  ["folder", "options", "mode"].forEach(k => $$(".mc-" + k).addEventListener("click", () => {
    if (k === "options" && host && host.options) { openHostOptions(); return; }   // 2o: bảng Options THẬT của AWord
    ovPanel.dataset.kind === k && !ovPanel.hidden ? closePanel() : openPanel(k);
  }));
  // 2o: AWord — bảng Options của AWord gắn lên chính ô game, neo trên hàng nút; game dừng (như bảng riêng) tới khi bảng đóng
  function openHostOptions() {
    if (!ovPanel.hidden) closePanel();
    if (phase !== "menu" && phase !== "end" && !paused) { paused = true; panelPaused = true; sfx.suspend(); }
    const bar = mount.querySelector(".mc-outbar");
    host.options({ layer: mount, top: () => bar.getBoundingClientRect().top - mount.getBoundingClientRect().top,
      onClose: () => { if (panelPaused) { panelPaused = false; paused = false; sfx.resume(); } } });
  }
  $$(".mc-pn-x").addEventListener("click", closePanel);
  ovPanel.addEventListener("click", e => { if (e.target === ovPanel) closePanel(); });

  // ---------------------------------------------------------------- màn chờ: mê cung dựng sẵn làm nền
  { const q = new URLSearchParams(location.search).get("dpad"); if (DPAD_STYLES.includes(q)) opt.dpadStyle = q; }
  paintOpts(); applyDpad();
  useMap(MAPS[0]); wallAnim.dir = 1; wallAnim.t = 99; paintWalls(); wallAnim.dir = 0;

  // ================= 1p: INTRO CỐT TRUYỆN + màn chờ thiên hà
  const ROBOTS = +(new URLSearchParams(location.search).get("robots") || 1);   // 2 = xem thử cảnh Fight (thả 2 robot)
  const mate = astro2;                                            // 1u: đồng đội = robot đội B (luôn có; chỉ hiện ở Fight hoặc ?robots=2)
  mate.g.visible = false; mate.g.scale.setScalar(1.75); mate.g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const mateOn = () => fight || ROBOTS > 1;
  function mateRC0() { const c = START.c - 1 >= 0 && grid[START.r][START.c - 1] && grid[START.r][START.c - 1].on ? START.c - 1 : START.c + 1; return { r: START.r, c }; }
  function mateRC() { return spawnOf(1); }
  function mateCell() { const { r, c } = mateRC(); return [cellX(c), cellZ(r)]; }
  function teamSink() { if (!mateOn() || !mate.g.visible) return; const [x, z] = mateCell(); hatches.run(x, z, { mode: "sink", depth: P_DEPTH, speed: 1.3, onLift: v => { pl2.lift = v; }, onHidden: () => { mate.g.visible = false; pl2.lift = 0; } }); }
  let riseYaw = 0, mateYaw = 0;
  const mateBase = () => 0.02 + PAD_H;                                      // 1t: đồng đội đứng trên nắp ô của mình
  const introCtx = {
    scene, fleet: ship, snd: sfx.intro, stage, D, camera, subtitle: title || `${questions.length} questions`,
    act: act || title || "UNKNOWN SECTOR", target: questions.length, deckBottom: -DECK_T,   // 1q: dòng POSITION / TARGET của cảnh báo
    sky: sky.material, atmo: ATMO_SHADER, astro,
    get overview() { return { pos: overview.pos, look: overview.look, fov: V.fov }; },
    start: () => { const s0 = spawnOf(0); return { x: cellX(s0.c), z: cellZ(s0.r) }; },
    focus: () => { const a = spawnOf(0), b = spawnOf(1); if (!fight) return { x: cellX(a.c), z: cellZ(a.r), k: 1 };
      const x = (cellX(a.c) + cellX(b.c)) / 2, z = (cellZ(a.r) + cellZ(b.r)) / 2, sep = Math.hypot(cellX(a.c) - cellX(b.c), cellZ(a.r) - cellZ(b.r));
      return { x, z, k: Math.max(1, sep / 9) }; },
    setCam(p, l, fov, roll = 0) { cineCam = cineCam || { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: V.fov, roll: 0 }; cineCam.pos.copy(p); cineCam.look.copy(l); cineCam.fov = fov; cineCam.roll = roll; },
    clearCam() { cineCam = null; camera.up.set(0, 1, 0); },
    shake(k) { cam.trauma = Math.max(cam.trauma, k); },
    prepMap() { introMap = makeDeck()(); },
    useMap() { useMap(introMap); wallAnim.dir = -1; wallAnim.t = 99; paintWalls(); wallAnim.dir = 0; clearPads(); ens = []; drones.forEach(d => { d.g.visible = false; }); },
    alarm(on) { setAlarm(on); },                                    // 2f: robot chui vào cửa gầm ⇒ báo động đột nhập
    raiseWalls() { raiseWallsIntro(); },   // 2f (2h: lõi tự gọi 3 s trước khi địch trồi)
    robot: {
      free(on) { robotFree = on; },
      rise(speed = 1.4, camPos = overview.pos) {                     // 1q: trồi lên QUAY LƯNG về máy quay (thấy ANDREW TEAM trên ba lô)
        const s0 = spawnOf(0); robotFree = false; Object.assign(pl, { r: s0.r, c: s0.c, nr: s0.r, nc: s0.c, t: 0, moving: false, eject: 0, leave: 0 });
        riseYaw = Math.atan2(camPos.x - cellX(s0.c), camPos.z - cellZ(s0.r)) + Math.PI;
        pl.heading = riseYaw; astro.g.rotation.set(0, pl.heading, 0);   // lookAt lúc bay để lại góc x/z ⇒ xoá
        appearPlayer(speed);
      },
      turn(k) {                                                      // 2b: quay dần từ lưng sang THẲNG MẶT về góc chơi chính (máy quay toàn cảnh), đường ngắn nhất
        const s0 = spawnOf(0), face = Math.atan2(overview.pos.x - cellX(s0.c), overview.pos.z - cellZ(s0.r));
        pl.heading = riseYaw + Math.atan2(Math.sin(face - riseYaw), Math.cos(face - riseYaw)) * k;
      },
      place() { const s0 = spawnOf(0); robotFree = false; astro.g.rotation.set(0, 0, 0); Object.assign(pl, { r: s0.r, c: s0.c, nr: s0.r, nc: s0.c, t: 0, moving: false, lift: 0, hold: null, eject: 0, leave: 0, salute: false }); astro.body.rotation.set(0, 0, 0); astro.g.visible = true; astro.g.scale.setScalar(1.75); },
    },
    teammate: {
      get on() { return mateOn(); }, get model() { return mateOn() ? mate : null; }, cell: () => mateCell(),
      rise(speed = 1.4, camPos = overview.pos) {
        if (!mateOn()) return; const [x, z] = mateCell(), m = mateRC();
        mate.body.rotation.set(0, 0, 0); mate.legs.forEach(l => { l.rotation.x = 0; }); mate.arms.forEach(a => { a.rotation.set(0, 0, 0); });
        mateYaw = Math.atan2(camPos.x - x, camPos.z - z) + Math.PI;
        // 1v: LỖI CŨ — animRobot(pl2) chạy lại sau intro nhưng pl2 còn ở ô (0,0), độ nâng bị ghi đè ⇒ robot B không chui lên đúng chỗ.
        //     Nay giống robot A: đặt pl2 đúng ô, nâng bằng pl2.lift, animRobot lo vị trí + độ cao.
        Object.assign(pl2, { r: m.r, c: m.c, nr: m.r, nc: m.c, t: 0, moving: false, eject: 0, leave: 0, dir: null, queued: null, hurt: "", down: false, hold: null, salute: false, lift: -P_DEPTH, heading: mateYaw });
        mate.g.visible = true; mate.g.scale.setScalar(1.75); mate.g.rotation.set(0, mateYaw, 0); mate.g.position.set(x, 0.02 - P_DEPTH, z);
        hatches.run(x, z, { mode: "rise", depth: P_DEPTH, speed, onLift: v => { pl2.lift = v; }, onDone: () => { pl2.lift = 0; } });
      },
      turn(k) { if (!mateOn()) return; const [x, z] = mateCell(), face = Math.atan2(overview.pos.x - x, overview.pos.z - z);   // 2b: cũng quay thẳng mặt về góc chơi chính
        pl2.heading = mateYaw + Math.atan2(Math.sin(face - mateYaw), Math.cos(face - mateYaw)) * k; },
      clear() { if (mate) mate.g.visible = false; Object.assign(pl2, { lift: 0, hold: null }); },
    },
  };
  renderer.localClippingEnabled = true;                     // 2e: mặt cắt cho cổng ra/vào của intro (gắn trước khi làm nóng ⇒ shader dịch đúng một lần)
  const intro = createIntro(introCtx);
  function beginIntro() {
    sfx.unlock(); sfx.click();
    ovStart.hidden = ovEnd.hidden = ovPause.hidden = true; topEl.hidden = true;
    phase = "cine"; jobs = []; paused = false; applyDpad();
    intro.start(() => startGame({ fromIntro: true }));   // 1r: intro vẫn lái máy quay sau khi game nhận (intro.tailing)
  }
  // bấm ĐÚP (chuột hoặc chạm) ⇒ bỏ qua intro
  let tapT = 0, tapX = 0, tapY = 0;
  stage.addEventListener("pointerdown", e => {
    if (phase !== "cine") return;
    const now = performance.now();
    if (now - tapT < 380 && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 60) { tapT = 0; intro.skip(); return; }
    tapT = now; tapX = e.clientX; tapY = e.clientY;
  });

  // 1p: làm nóng shader mọi vật của TRẬN ĐẤU ngay lúc tải (máy quay còn ở góc game), rồi mới chuyển sang màn chờ thiên hà
  // 2c: vẽ THẬT mọi vật một lần (ANGLE hoãn dịch shader tới lần vẽ đầu ⇒ khựng 24–26 ms lúc trao sang câu 1 dù đã compile())
  function warmDrawAll() {
    const effVis = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
    const lights = []; scene.traverse(o => { if (o.isLight) lights.push([o, effVis(o)]); });
    const saved = []; scene.traverse(o => { saved.push([o, o.visible, o.frustumCulled]); if (!o.isLight) { o.visible = true; o.frustumCulled = false; } });
    lights.forEach(([l, eff]) => { l.visible = eff; });                  // số đèn đang sáng giữ nguyên ⇒ đúng biến thể shader lúc chơi
    try { renderer.shadowMap.needsUpdate = true; composer.render(); } catch (e) { /* bỏ qua */ }
    saved.forEach(([o, v, f]) => { o.visible = v; o.frustumCulled = f; });
  }
  // 2c: vẽ thử đúng cảnh robot trồi lên qua nắp boong (ảnh hầm máy + bóng trong hầm) — lần đầu thật ở cuối intro khựng ~10 ms
  function warmRise() {
    const vis = astro.g.visible, pos = astro.g.position.clone();
    try {
      astro.g.visible = true; astro.g.position.set(0, 0.02 - P_DEPTH * 0.5, 0); astro.g.updateMatrixWorld(true);
      hatches.run(0, 0, { mode: "rise" }); hatches.update(0.5, 0); underdeck.update(0.016, 0);
      renderer.shadowMap.needsUpdate = true; portal.render(scene, camera); composer.render();
    } catch (e) { /* bỏ qua */ }
    hatches.clear(); astro.g.visible = vis; astro.g.position.copy(pos); astro.g.updateMatrixWorld(true);
  }
  warmInGame(); warmInGame2(); warmDrawAll(); warmRise(); intro.menu();
  /* 2i: nhạc màn chờ — trình duyệt chỉ cho phát sau cú chạm đầu tiên ⇒ thử ngay, và bật lại ở cú chạm đầu */
  sfx.unlock(); sfx.menu?.();
  { const wake = () => { sfx.unlock(); if (phase === "menu") sfx.menu?.(); }; on(window, "pointerdown", wake, { once: true, capture: true }); on(window, "keydown", wake, { once: true, capture: true }); }

  let last = performance.now(), manual = false;
  // 2e: đã thử "vẽ cách 1 nhịp màn hình" cho khung đều — màn máy này có tần số thay đổi (VRR), đo bật/tắt không thấy lợi ⇒ bỏ, giữ vòng vẽ gốc
  // 2p: GHIM shader — vật tạo/huỷ mỗi câu (mảnh xác robot, vết cháy…) dispose vật liệu ⇒ three.js XOÁ program khi hết người dùng ⇒ câu sau dịch lại
  //   (đo: + ở pha hold, − ở intro câu sau, 11–19 ms/lần). Cộng 1 lượt dùng cho mỗi program một lần ⇒ không bao giờ về 0 ⇒ dùng lại mãi.
  let pinT = 0;
  function pinPrograms() { const ps = renderer.info.programs; if (ps) for (const p of ps) if (!p.__pin2p) { p.__pin2p = true; p.usedTimes++; } }
  let rafId = 0;
  function frame(now) {
    if (dead) return;                                  // 2n: destroy() ⇒ thôi vẽ
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    stepDeck();                                        // 2p: sàn đang vẽ chia khung
    if (++pinT >= 30) { pinT = 0; pinPrograms(); }   // 2p: giữ shader sống
    if (!manual) { if (!paused) AQ.frame(now); else AQ.pause(); update(dt); render(); }   // 2p: tự giữ 60 khung
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  // bàn thử (khung xem trước bị ẩn ⇒ rAF không chạy: lái tay bằng step)
  const api = {
    get quality() { return AQ.info; }, get deckBusy() { return !!deckJob; },   // 2p: bàn thử
    // 2n: dỡ hẳn game (AWord rời act / đổi act / đổi template). Gọi lại lần nữa vô hại.
    destroy() {
      if (dead) return; dead = true;
      cancelAnimationFrame(rafId);
      if (deckJob) { deckJob.cancel(); deckJob = null; }   // 2p
      offs.splice(0).forEach(f => { try { f(); } catch (e) { /* bỏ qua */ } });
      try { remote && remote.detach && remote.detach(); } catch (e) { /* bỏ qua */ }   // 2q
      try { closeSnd(); } catch (e) { /* bỏ qua */ }
      try { if (intro && (intro.active || intro.tailing)) intro.abort(); } catch (e) { /* bỏ qua */ }
      try { sfx.close(); } catch (e) { /* bỏ qua */ }
      try { composer.dispose && composer.dispose(); } catch (e) { /* bỏ qua */ }
      try { pmrem.dispose(); } catch (e) { /* bỏ qua */ }
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* bỏ qua */ }
      mount.innerHTML = ""; mount.classList.remove("mc-root", "is-fightgame");
      if (window.__mc === api) delete window.__mc;
    },
    get dead() { return dead; },
    // 2o: AWord ▸ Options ▸ Apply (bảng thật của AWord) ⇒ áp ngay như Apply của bảng riêng. Chỉ nhận đúng khoá + đúng kiểu.
    setOptions(o) {
      if (dead || !o || typeof o !== "object") return false;
      const d = pickOpt(opt);
      Object.keys(DEFAULTS).forEach(k => { if (k in o && typeof o[k] === typeof DEFAULTS[k]) d[k] = o[k]; });
      applyFrom(d, false);
      return true;
    },
    start: startGame,
    step(n = 1, dt = 1 / 60) { manual = true; const t0 = performance.now(); for (let i = 0; i < n; i++) update(dt); const t1 = performance.now(); render(); api.prof = { update: +(t1 - t0).toFixed(1), render: +(performance.now() - t1).toFixed(1) }; return api.state(); },
    resume() { manual = false; last = performance.now(); },
    snap() { render(); return canvas.toDataURL("image/jpeg", 0.85); },
    go(dir, t = 0) { queueDir(dir, teams[t].pl); },
    remotePress, padState: () => padSt.slice(),   // 2q: bàn thử iPad
    bomb: (t = 0) => placeBomb(teams[t]), teams, setFight(v) { setFightMode(!!v); },
    detonateAt(r, c) { const b = bombAt(r, c); if (b) detonate(b); },
    dropBomb(r, c) { if (bombAt(r, c)) return; spawnBomb(r, c); },
    astro, ship, hatches, boom, renderer, composer, bloom, scene, portal, underdeck, camera, launchShip: () => ship.launch(), pct: () => pctNow + "%", walls: () => walls.length, cell: (r, c) => grid[r] && grid[r][c] && { on: grid[r][c].on, u: grid[r][c].u, d: grid[r][c].d, l: grid[r][c].l, r: grid[r][c].r },
    enemyNext: () => ens.map(e => ({ at: [e.r, e.c], open: DK.filter(k => open(e, k)).map(k => [e.r + DIRS[k].dr, e.c + DIRS[k].dc]) })), bombs: () => bombs.filter(b => !b.gone).map(b => [b.r, b.c]), bombsLeft: () => bombsLeft,
    autoTo(r, c) { autoTo = [r, c]; }, portals: () => gatePair && gatePair.map(g => [g.r, g.c, g.d]), gateUse: (t = 0) => { const T = teams[t], g = gatePair && gatePair[0]; if (!g) return 'no gate'; T.pl.hold = null; Object.assign(T.pl, { r: g.r, c: g.c, nr: g.r, nc: g.c, t: 0, moving: false, dir: null, queued: g.d }); return [g.r, g.c, g.d]; }, gates, spawns: () => SPAWN.slice(), fair: () => fightFair, wings,
    cam(p, l) { camOverride = p ? { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) } : null; },
    where() { const [x, z] = entityPos(pl); return { player: [x, z], enemies: ens.map(e => entityPos(e)) }; },
    press(screenDir, t = 0) { const T = teams[t], g = screenToGrid(...SCREEN_VEC[screenDir], T.pl); if (g) queueDir(g, T.pl); return g; },
    set autoplay(v) { autoplay = !!v; },
    intro: () => beginIntro(), skipIntro: () => intro.skip(), get introActive() { return intro.active; }, get autoplay() { return autoplay; },
    opt, sfx, maps: MAPS, useMap: i => { useMap(MAPS[i]); wallAnim.dir = 1; wallAnim.t = 99; paintWalls(); }, map: () => curMap && curMap.map.name,
    state: () => ({ phase, qi, fight, teams: fight ? teams.map(T => ({ lives: T.lives, score: T.score, bombs: T.bombs, st: T.status, at: [T.pl.r, T.pl.c] })) : null, lives, score, time: +playT.toFixed(2), player: [pl.r, pl.c, pl.dir, pl.moving], enemies: ens.map(e => [e.r, e.c]), pads: pads.map(p => [p.r, p.c, p.text, p.correct, p.state]) }),
  };
  // 2q: nối iPad SAU khi mọi thứ đã dựng (nút Tablet, D-pad, teams) — đường nối có thể báo trạng thái ngay lúc attach
  if (remote) {
    try {
      remote.attach({
        press: remotePress,
        status(t, st) { if (dead) return; padSt[t ? 1 : 0] = st || ""; paintPadTags(); },
      });
    } catch (e) { console.warn("STAR LOOT: iPad link", e); }
  }
  window.__mc = api;
  return api;
}

// ------------------------------------------------------------------ 1v: LED 7 thanh neon (SVG) — điểm + đồng hồ ở Fight
const LED_MAP = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
const LED_POLY = (() => {
  const H = (cx, cy, len, t) => [[cx - len / 2, cy], [cx - len / 2 + t / 2, cy - t / 2], [cx + len / 2 - t / 2, cy - t / 2], [cx + len / 2, cy], [cx + len / 2 - t / 2, cy + t / 2], [cx - len / 2 + t / 2, cy + t / 2]];
  const Vv = (cx, cy, len, t) => H(cx, cy, len, t).map(([x, y]) => [cx + (y - cy), cy + (x - cx)]);
  const q = a => a.map(p => p.map(n => +n.toFixed(1)).join(",")).join(" ");
  return { a: q(H(25, 5, 35, 8)), g: q(H(25, 45, 35, 8)), d: q(H(25, 85, 35, 8)), f: q(Vv(5, 25, 35, 8)), b: q(Vv(45, 25, 35, 8)), e: q(Vv(5, 65, 35, 8)), c: q(Vv(45, 65, 35, 8)) };
})();
function ledHtml(str) {
  return [...String(str)].map(ch => {
    if (ch === ":") return `<svg class="lc" viewBox="0 0 16 90"><circle cx="8" cy="30" r="4.6"/><circle cx="8" cy="62" r="4.6"/></svg>`;
    const on = LED_MAP[ch] || "";
    return `<svg class="ld" viewBox="0 0 50 90">${"abcdefg".split("").map(k => `<polygon class="${on.includes(k) ? "on" : "off"}" points="${LED_POLY[k]}"/>`).join("")}</svg>`;
  }).join("");
}
function ledSet(el, str) { if (el._v === str) return; el._v = str; el.innerHTML = ledHtml(str); }

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
