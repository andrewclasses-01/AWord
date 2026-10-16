// RACING WORDS — màn iPad mẫu 4f (16/10/2026) = padui-3y + thầy sau buổi thử TOMKO: "luôn lấy mốc cân bằng của iPad mà không cần reset level":
//   · MỐC CÂN BẰNG TUYỆT ĐỐI: cầm iPad như vô lăng thì "thẳng" = trọng lực nằm dọc đúng 1 trục của máy (ngang ⇒ trục x, dọc ⇒ trục y) ⇒ mốc lấy theo
//     hướng màn (screen.orientation), không theo tư thế lúc bật nghiêng (3y: lúc bật đang nghiêng ⇒ lệch mãi tới khi bấm LEVEL). Bỏ nút LEVEL.
//     Xoay màn (ngang ↔ dọc / lật đầu) ⇒ tự lấy lại mốc.
//   · tự bật nghiêng nếu Safari đã cho phép cảm biến (có sự kiện devicemotion ⇒ không cần chạm "TAP TO TURN ON TILT").
//   · trạng thái nối "SLOW" ghi rõ đang tự sửa (đường nối 4f tự bắt tay lại).
//   · đường nối: sr3d-padlink-4f.js.
// ---- gốc 3y ----
// RACING WORDS — màn iPad mẫu 3y (16/10/2026) = padui-3x + dấu đỉnh vô lăng = MÁY BAY GIẤY logo Andrew Classes, thầy chọn "S1 nhưng nhỏ hơn ~10 %"
//   (chon-dau-vo-lang.html: cỡ S cao 18 ⇒ 16,2 đơn vị vô lăng, tâm y 19 — nằm gọn trong vành; màu đội: cánh trái pha 50 % trắng, cánh phải màu đội; viền tối; không sao; không filter).
// ---- gốc 3x ----
// RACING WORDS — màn iPad mẫu 3x (16/10/2026) = padui-3w — thầy: "nghiêng thì vô lăng theo hơi chậm, cần nhạy hơn" + "góc vô lăng tối đa nhiều hơn chút":
//   · bớt trễ: độ mượt mặc định 20 % ⇒ 6 %, vô lăng vẽ bám 0,6 ⇒ 0,9/khung, lọc gia tốc 0,3 ⇒ 0,5/sự kiện, dò trục con quay sau 15° (3w: 25°).
//   · con quay tự KIỂM LẠI: góc con quay lệch góc gia tốc > 6° kéo dài ~1 s ⇒ bỏ trục đã chốt, dò lại (chốt nhầm trục ⇒ lái trôi, chậm).
//   · vô lăng vẽ xoay tối đa ≈ 22° (3w: ≈ 15°).
// ---- gốc 3w ----
// RACING WORDS — màn iPad mẫu 3w (16/10/2026) = padui-3v (thầy: "mượt rồi") + 3 chỉnh, không đụng độ mượt (không filter, chỉ transform):
//   · dấu đỉnh vô lăng: ô chữ nhật màu đội ⇒ VẠCH CONG ôm vành (bo tròn, rãnh chìm, vệt bóng mảnh) — cả vô lăng đủ lẫn vô lăng nhẹ.
//   · vạch báo lái: VẠCH SÁNG NGẮN ở giữa, nghiêng bên nào DÀI RA bên đó, đuôi mờ dần (gradient + mặt nạ dọc, không blur); bỏ vạch dọc giữa + nền.
//   · quá góc hết cỡ vẫn lái thêm được rất ít: tới góc hết cỡ = 88 %, quá nữa tiến dần về 100 % (1 − e^(−Δ/12°)) — "cố được tí như thật".
// ---- gốc 3v ----
// RACING WORDS — màn iPad mẫu 3v (16/10/2026) = padui-3u — thầy đo trên iPad thật: đứng yên 60 fps, NGHIÊNG ⇒ 20 fps, khung chậm 50 ms;
//   cảm biến 61/s tốt; "không thích bị khoá nhẹ ở giữa"; "có thể bỏ đèn sáng vô lăng hoặc cách báo khác nhẹ hơn".
//   · gốc nặng: trong vô lăng có 6 nét sáng feGaussianBlur (vệt sáng 2 bên vành, kể cả lúc opacity 0) + chữ ATEAM lọc mờ; vô lăng xoay ⇒ Safari vẽ lại
//     cả bộ lọc mỗi khung; thêm --sa / lớp l/r đổi ~30 lần/giây trên khung cha + quầng .ip-glow blur 4vmin.
//   · lái nghiêng: vô lăng dùng WHEEL_LITE (bỏ hẳn nét sáng + mọi filter; ATEAM sáng bằng nét viền), bỏ quầng sáng, không đổi lớp/biến trên khung cha;
//     báo lái = VẠCH MẢNH trên vô lăng (.ip-smeter) chỉ đổi transform (ghép lớp, không vẽ lại).
//   · bỏ vùng khoá giữa: mặc định vùng đi thẳng 0°, độ cong 1,0 (nghiêng bao nhiêu lái bấy nhiêu).
//   · con quay: TỰ DÒ TRỤC + CHIỀU (alpha/beta/gamma — Safari iPad báo khác lý thuyết: 3u chốt "flipped") rồi mới trộn; chưa dò xong chỉ dùng gia tốc.
// ---- gốc 3u ----
// RACING WORDS — màn iPad mẫu 3u (16/10/2026) = padui-3t, cùng hình — thầy: "xoay vô lăng trên iPad (nghiêng) hơi giật nhẹ, không mượt":
//   · vô lăng: bỏ transition .05s (3m) — đặt góc MỖI KHUNG mà còn transition ⇒ chuyển động bị cắt rồi chạy lại ⇒ rung;
//     bỏ filter drop-shadow trên khối XOAY (mỗi khung iPad vẽ lại cả bóng mờ) ⇒ bóng là lớp ĐỨNG YÊN bên dưới; will-change ⇒ chỉ ghép lớp.
//   · góc vô lăng lấy THẲNG độ lái nghiêng từng khung (3t chỉ đổi theo nhịp gửi ~30 lần/giây ⇒ nhích bậc thang).
//   · quầng sáng bên đang lái: bỏ mix-blend-mode, will-change opacity (chỉ đổi độ mờ, không vẽ lại).
//   · cảm biến: gia tốc chỉ kéo 2 %/sự kiện (3t: 5 % ⇒ tay run lọt vào); chiều con quay CHỐT sau khi chắc chắn (đổi tối đa 1 lần).
//   · stats(): khung/giây, khung chậm nhất, cảm biến lần/giây + khoảng hở lớn nhất, số lần gửi/giây — trang thiết kế hiện lên để đo trên iPad thật.
// ---- gốc 3t ----
// RACING WORDS — màn iPad mẫu 3t (16/10/2026) = padui-3s + thầy chỉnh sau khi xem 3s:
//   · lái nghiêng: vô lăng vẽ vẫn XOAY NHẸ cùng chiều (≈ 15° khi hết cỡ) cho có cảm giác vô lăng đang chạy, đỡ cứng.
//   · bỏ chữ "TAP ANYWHERE UP HERE…" — chỗ đó là hàng TÊN LỬA CON; nạp ⇒ tên lửa con BAY LÊN thành quả to.
//   · các phím chức năng (đội · trạng thái · chế độ · LEVEL) gom vào 1 DẢI trên cùng, cách dải tên lửa một khoảng.
//   · thanh boost (đổ đầy trong bàn đạp ga + vạch Nitro) viền MỀM (dải mờ ở mép) + tăng giảm trôi mượt.
// ---- gốc 3s ----
// RACING WORDS — màn iPad mẫu 3s (16/10/2026) = padui-3m + thầy chốt "A2" khi CẦM iPad như vô lăng:
//   · PHANH bên TRÁI, GA (boost) bên PHẢI (cả iPad lẫn game) — đảo bố cục B của 3g.
//   · cả DẢI TRÊN (phần kính trên vạch tap-lô, 30 % màn) là nút TÊN LỬA: hai ngón cái với lên là bắn, bấm chỗ nào trong dải cũng được.
//   · LÁI NGHIÊNG (setSteer({mode:"tilt"})): góc = trọng lực chiếu lên mặt màn so với lúc "đặt thẳng", tính trong hệ toạ độ CỦA MÁY
//     (+ con quay rotationRate.alpha trộn, dấu tự dò) — như trang thử thu-nghieng-3s.html. Vô lăng vẽ ĐỨNG YÊN (chính iPad là vô lăng), sáng bên đang lái.
//   · sửa lỗi 3m "nút tên lửa không bắn": .ip-row phủ KÍN màn (absolute inset 0) đứng sau .ip-fire ⇒ chạm rơi vào hàng ⇒ nay hàng không nhận chạm.
// ---- gốc 3m ----
// RACING WORDS — màn iPad mẫu 3m = sr3d-padui-3h.js, chỉ đổi tên game hiển thị.
// SPEED RUN mẫu 3h — MÀN iPAD (15/10/2026) = padui-3g + vô lăng ATEAM LED (sr3d-dash-3h.js).
// ---- gốc 3g ----
// SPEED RUN mẫu 3g — MÀN iPAD (15/10/2026) = padui-3e + thầy chọn bố cục B (thiet-ke-ipad-dua.html): GA sát mép TRÁI, PHANH sát mép PHẢI (đúng chỗ 2 ngón cái),
//   vô lăng ĐÁY PHẲNG (dash-3g) ở giữa có khoảng trống lớn 2 bên, tên lửa góc trên phải trên phanh. Đơn vị vw/vh = màn iPad (Safari đã trừ thanh trạng thái).
// ---- gốc 3e ----
// SPEED RUN mẫu 3e — MÀN iPAD (15/10/2026) = padui-3d + hình dash-3e (bàn đạp hẹp/dài, vệt sáng vô lăng mới) + nút tên lửa 2 ô: chính quả trong nút bay,
//   quả chờ thụt xuống + quả mới trồi lên nạp vào (như game) · vô lăng chỉ nhận bấm trong vòng tròn.
// ---- gốc 3d ----
// SPEED RUN mẫu 3d — MÀN iPAD (15/10/2026) = padui-3c + bỏ chữ dưới bàn đạp (bàn đạp dài hết), hình từ sr3d-dash-3h.js (bàn đạp rộng bằng nhau,
//   cung vô lăng mờ 2 đầu, nút tên lửa 2 quả song song).
// ---- gốc 3c ----
// SPEED RUN mẫu 3c — MÀN iPAD (15/10/2026) = padui-3b + vô lăng sáng 1 cung 1/4 bên đang bấm, bàn đạp treo (chỉ phần dưới lún),
//   nút tên lửa chỉ icon 2 quả chéo (bấm ⇒ 1 quả vút lên trong nút) + tên lửa chờ dựng đứng ≤ 4 + "+x" — hình từ sr3d-dash-3h.js (y hệt game).
// ---- gốc 3b ----
// SPEED RUN mẫu 3b — MÀN iPAD theo 3 CHẾ ĐỘ (15/10/2026). Chế độ do MÀN LỚN chọn (nút iPad trong hàng nút) và gửi sang ("m:").
//   0 TẮT        — iPad chỉ báo "iPad is off".
//   1 TRẢ LỜI    — iPad hiện CÂU HỎI + 4 nút đáp án (màn lớn chỉ hiện đáp án); bấm ⇒ "a:<k>:<số câu>"; tô đúng/sai theo kết quả game gửi lại.
//   2 ĐUA        — iPad = tap-lô Y HỆT game: bàn đạp GA (trái) · VÔ LĂNG (giữ nửa trái/phải để lái, sáng màu đội) · bàn đạp PHANH (phải)
//                  + nút TÊN LỬA (thầy: "thêm một nút tên lửa ở một chỗ phù hợp"): góc TRÊN PHẢI, ngay trên bàn đạp phanh — ngón cái phải
//                  trượt lên là tới, không lẫn với bàn đạp; số quả + 3 ống hiện trên nút. Màn vô lăng: km/h + 4 ô năng lượng + thanh Nitro (như game).
//   mountPadApp(mount, { team, client, onBack }) ⇒ { setState, setInfo, setMode, setQ } · mountPadChooser(mount, { onPick })
import { TEAM_META } from "./sr3d-padlink-4f.js";
import { WHEEL_SVG, GAS_SVG, BRAKE_SVG, FIRE_ICON, FLY_HTML, reserveHTML } from "./sr3d-dash-3h.js";
// 3v: vô lăng NHẸ cho lái nghiêng — cùng hình, bỏ 2 nhóm nét sáng (6 path blur) + mọi <filter>; chữ ATEAM sáng bằng nét viền mờ thay bộ lọc
// 3w: dấu đỉnh = vạch cong theo vành ⇒ 3y: máy bay giấy (xem dưới)
const TOP_OLD = '<path d="M93 8.3 h14 v20 h-14 Z" fill="var(--team)"/>';
// 3y: máy bay giấy của logo Andrew Classes (nét gốc hệ 512: 2 cánh tam giác, mũi (256,120)), cao 16,2 đơn vị vô lăng, tâm (100,19)
const PL_K = 16.2 / 288, PL_SW = (1.5 / PL_K).toFixed(1);
const TOP_NEW = `<g transform="translate(100 19) scale(${PL_K.toFixed(4)}) translate(-256 -264)">`
  + `<path d="M256 408 L256 120 L86 380 Q174.40 364 256 408Z" fill="color-mix(in srgb, var(--team) 50%, white)" stroke="#06080b" stroke-width="${PL_SW}" paint-order="stroke" stroke-linejoin="round"/>`
  + `<path d="M256 408 L256 120 L426 380 Q337.60 364 256 408Z" fill="var(--team)" stroke="#06080b" stroke-width="${PL_SW}" paint-order="stroke" stroke-linejoin="round"/></g>`;
if (!WHEEL_SVG.includes(TOP_OLD)) console.warn("RACING WORDS 3w: không thấy dấu đỉnh cũ của vô lăng");
const WHEEL_FULL = WHEEL_SVG.replace(TOP_OLD, TOP_NEW);
const WHEEL_LITE = WHEEL_FULL
  .replace(/<g class="wg[^"]*">[\s\S]*?<\/g>/g, "")
  .replace(/<filter id="srwgb6"[\s\S]*?<\/filter>/, "").replace(/<filter id="srwgb2"[\s\S]*?<\/filter>/, "")
  .replace(/<defs><filter id="srwgat"[\s\S]*?<\/filter><\/defs>/, "")
  .replace(/<text ([^>]*) fill="var\(--team\)" filter="url\(#srwgat\)">ATEAM<\/text>/,
    '<text $1 fill="none" stroke="var(--team)" stroke-width="3.4" stroke-opacity=".4" stroke-linejoin="round">ATEAM</text><text $1 fill="var(--team)">ATEAM</text>');

const CSS = `
html,body{margin:0;height:100%;overflow:hidden;background:#05060a;overscroll-behavior:none}
.ip,.ipc{position:fixed;inset:0;font-family:"Exo 2",system-ui,sans-serif;color:#e2e8f0;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;
  background:radial-gradient(120% 90% at 50% 0%,#18233a 0%,#07090f 60%,#030408 100%)}
.ip::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;box-shadow:inset 0 0 18vmin rgba(255,30,20,.9)}
.ip[data-alarm="1"]::after{animation:ipa .5s ease-in-out infinite alternate}
.ip[data-alarm="2"]::after{animation:ipa .15s ease-in-out infinite alternate}
@keyframes ipa{from{opacity:.2}to{opacity:.95}}
.ip-top{position:absolute;left:max(2.4vmin,env(safe-area-inset-left));top:max(2.4vmin,env(safe-area-inset-top));display:flex;align-items:center;gap:1.4vmin;z-index:3}
.ip-back{width:max(44px,5.6vmin);height:max(44px,5.6vmin);border-radius:50%;border:1px solid rgba(140,210,255,.4);background:rgba(255,255,255,.06);color:#cbd5e1;display:grid;place-items:center;cursor:pointer;padding:0}
.ip-back svg{width:55%;height:55%}
.ip-team{font:italic 900 max(22px,3.4vmin) "Exo 2",sans-serif;letter-spacing:.1em;color:var(--tc)}
.ip-st{display:flex;align-items:center;gap:.8vmin;font-weight:700;font-size:max(15px,2vmin);color:#cbd5e1}
.ip-st i{width:max(11px,1.4vmin);height:max(11px,1.4vmin);border-radius:50%;background:#64748b}
.ip[data-s="on"] .ip-st i{background:#4ade80;box-shadow:0 0 12px #4ade80}
.ip[data-s="relay"] .ip-st i{background:#facc15}
.ip[data-s="connecting"] .ip-st i,.ip[data-s="nogame"] .ip-st i{animation:ipb 1s steps(2) infinite}
@keyframes ipb{50%{opacity:.2}}
.ip-rtt{font:600 max(13px,1.6vmin) ui-monospace,Consolas,monospace;color:#94a3b8}
.ip-mode{font:800 max(13px,1.7vmin) "Exo 2",sans-serif;letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;padding:.6vmin 1.4vmin;border-radius:99px;border:1px solid rgba(148,163,184,.35)}
.ip-scr{position:absolute;inset:0;display:none}
.ip[data-m="0"] .ip-off,.ip[data-m="1"] .ip-ans,.ip[data-m="2"] .ip-drv,.ip[data-m="w"] .ip-wait{display:block}
.ip-msg{position:absolute;left:8vw;right:8vw;top:50%;transform:translateY(-50%);text-align:center;display:flex;flex-direction:column;align-items:center;gap:2.4vmin}
.ip-msg b{font:italic 900 max(28px,6vmin) "Exo 2",sans-serif;letter-spacing:.06em;color:#fff3dd}
.ip-msg span{font-size:max(17px,2.6vmin);color:#94a3b8;line-height:1.4}
.ip-msg svg{width:14vmin;height:14vmin;color:#64748b}
/* --- chế độ 1: trả lời --- */
.ip-ans{padding:calc(max(2.4vmin,env(safe-area-inset-top)) + max(56px,7vmin)) 4vmin max(4vmin,env(safe-area-inset-bottom));box-sizing:border-box}
.ip-ans.is-shown{display:flex!important;flex-direction:column;gap:3vmin}
.ip-q{flex:0 0 auto;min-height:20vmin;display:grid;place-items:center;padding:2.4vmin 4vmin;border-radius:3vmin;text-align:center;
  background:linear-gradient(180deg,rgba(20,30,52,.95),rgba(10,15,28,.95));border:.5vmin solid color-mix(in srgb,var(--tc) 55%,transparent);
  font:700 max(22px,4.8vmin)/1.2 "Exo 2",sans-serif;color:#fff}
.ip-q[data-len="l"]{font-size:max(19px,3.8vmin)}.ip-q[data-len="xl"]{font-size:max(17px,3.2vmin)}
.ip-a{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:2.4vmin}
.ip-a[data-n="2"]{grid-template-columns:1fr}.ip-a[data-n="3"] button:last-child{grid-column:1/-1}
.ip-a button{border-radius:3vmin;border:.5vmin solid color-mix(in srgb,var(--tc) 45%,rgba(255,255,255,.2));background:linear-gradient(180deg,rgba(26,42,72,.95),rgba(12,20,38,.97));
  color:#fff;font:800 max(20px,4.6vmin)/1.15 "Exo 2",sans-serif;padding:1vmin 2vmin;cursor:pointer;touch-action:manipulation;transition:transform .08s,opacity .3s}
.ip-a button:active{transform:scale(.97)}
.ip-a button.ok{background:linear-gradient(180deg,#2cc06d,#178a49);border-color:#9dffc6}
.ip-a button.bad{background:linear-gradient(180deg,#e0413f,#a3201f);border-color:#ffb0a8}
.ip-a button.rev{border-color:#7dffb0;box-shadow:inset 0 0 0 1vmin #3fd884}
.ip-a.lock button:not(.ok):not(.bad):not(.rev){opacity:.4}
/* --- chế độ 2: tap-lô y hệt game --- */
.ip-drv{background:linear-gradient(180deg,transparent 0,transparent 30%,#15181d 31%,#0c0e11 100%)}
.ip-drv::before{content:"";position:absolute;left:0;right:0;top:30%;height:1vmin;background:#2f353f;box-shadow:0 -2vmin 4vmin rgba(0,0,0,.5)}
.ip-row{position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;align-items:flex-end;gap:2vmin;height:66vmin}
.ip-ped{position:relative;height:54vmin;padding:0;border:0;background:none;cursor:pointer;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
  transform-origin:50% 100%;transition:transform .07s;margin-bottom:3vmin}
.ip-ped .sr-pedal-svg{display:block;height:calc(100% - 4.4vmin);width:auto;filter:drop-shadow(0 1.4vmin 1.8vmin rgba(0,0,0,.6))}
.ip-ped span{font:italic 900 3.2vmin/4.4vmin "Exo 2",sans-serif;letter-spacing:.14em}
.ip-gas span{color:#7fe9ff}.ip-brk span{color:#ff9a8a}
.ip-ped.on{transform:perspective(80vmin) rotateX(16deg) scaleY(.95)}
.ip-ped.on .sr-pedal-svg{filter:drop-shadow(0 0 3vmin var(--tc)) drop-shadow(0 0 1vmin var(--tc)) brightness(1.25)}
.ip .sr-nfill{fill:rgba(70,230,255,.55);transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}
.ip-gas.nitro .sr-pedal-svg{filter:drop-shadow(0 0 2.4vmin rgba(80,230,255,.85))}
.ip-wbox{position:relative;width:66vmin;height:100%;cursor:pointer;touch-action:none;--team:var(--tc)}
.ip-wheel{position:absolute;left:50%;bottom:-13vmin;width:66vmin;height:66vmin;margin-left:-33vmin;transition:transform .05s linear;filter:drop-shadow(0 2vmin 3vmin rgba(0,0,0,.6))}
.ip-wheel>svg{position:absolute;inset:0;width:100%;height:100%}
.ip-glow{position:absolute;bottom:-13vmin;width:38vmin;height:66vmin;border-radius:50%;pointer-events:none;opacity:0;filter:blur(4vmin);mix-blend-mode:screen;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--tc) 95%,white),color-mix(in srgb,var(--tc) 55%,transparent) 60%,transparent);transition:opacity .12s}
.ip-glow.l{left:calc(50% - 36vmin)}.ip-glow.r{left:calc(50% - 2vmin)}
.ip-wbox.l .ip-glow.l,.ip-wbox.r .ip-glow.r{opacity:.95}
.ip-wbox.l .ip-wheel,.ip-wbox.r .ip-wheel{filter:drop-shadow(0 2vmin 3vmin rgba(0,0,0,.6)) drop-shadow(0 0 2.6vmin var(--tc))}
.ip-scrn{position:absolute;left:25%;right:25%;top:26%;height:31%;border-radius:2.6vmin;background:linear-gradient(180deg,#050a12,#0b1422);border:.5vmin solid #000;
  box-shadow:0 0 0 .45vmin color-mix(in srgb,var(--tc) 70%,transparent),inset 0 0 3.6vmin rgba(80,150,255,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6vmin}
.ip-src{font:900 2.4vmin "Exo 2",sans-serif;letter-spacing:.2em;color:#4ade80}
.ip-kmh{display:flex;align-items:baseline;gap:.6vmin;color:#fff}
.ip-kmh span{font:italic 900 10vmin/1 "Exo 2",sans-serif;min-width:2.1em;text-align:right}.ip-kmh small{font:800 2.6vmin "Exo 2",sans-serif;color:#9fb4e0}
.ip-cells{display:flex;gap:.6vmin;width:78%}
.ip-cells i{flex:1;height:2.6vmin;border-radius:.7vmin;background:linear-gradient(90deg,#ffd23f calc(var(--f,0)*100%),rgba(255,255,255,.12) 0)}
.ip-nbar{width:78%;height:1.6vmin;border-radius:.7vmin;background:rgba(255,255,255,.1);overflow:hidden}
.ip-nbar em{display:block;height:100%;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,#4ef0ff,#a77bff)}
.ip-fire{position:absolute;top:max(3.4vmin,env(safe-area-inset-top));right:max(4vmin,env(safe-area-inset-right));width:min(17vw,24vmin);aspect-ratio:1;border-radius:50%;border:0;padding:0;cursor:pointer;
  display:grid;place-items:center;touch-action:none;color:#7c4a3a;background:radial-gradient(circle at 40% 35%,#4a1a10,#1c0a06 75%);box-shadow:inset 0 0 0 .6vmin #7c2d12,0 1.4vmin 2.6vmin rgba(0,0,0,.55);transition:transform .06s}
.ip-fire svg{width:44%;height:44%;transform:rotate(45deg)}
.ip-fire span{position:absolute;bottom:13%;font:italic 900 2.6vmin "Exo 2",sans-serif;letter-spacing:.16em}
.ip-fire b{position:absolute;top:4%;right:4%;min-width:5vmin;height:5vmin;border-radius:2.5vmin;background:#fff;color:#c2290e;font:900 3.4vmin/5vmin "Exo 2",sans-serif;text-align:center}
.ip-fire.ready{color:#fff;background:radial-gradient(circle at 40% 35%,#ff7a4a,#c2290e 75%);box-shadow:inset 0 0 0 .6vmin #fed7aa,0 0 5vmin rgba(255,90,40,.6);animation:ipf .9s ease-in-out infinite alternate}
@keyframes ipf{to{box-shadow:inset 0 0 0 .6vmin #fed7aa,0 0 1.6vmin rgba(255,90,40,.4)}}
.ip-fire.hit{transform:scale(.9)}
.ip-warn{position:absolute;left:0;right:0;top:12vmin;text-align:center;font:italic 900 5vmin "Exo 2",sans-serif;color:#ff8a80;letter-spacing:.1em;pointer-events:none}
.ip-wheel .wg{opacity:0;transition:opacity .1s}.ip-wbox.l .wg.wl,.ip-wbox.r .wg.wr{opacity:1}
.ip-wbox.l .ip-wheel,.ip-wbox.r .ip-wheel{filter:drop-shadow(0 2vmin 3vmin rgba(0,0,0,.6))}
.ip-ped.on{transform:none}.ip-ped .mv{transition:transform .08s,filter .1s}.ip-ped.on .mv{transform:translateY(4px) scale(.96,.9);filter:drop-shadow(0 0 4px var(--tc)) brightness(1.25)}
.ip-ped.on .sr-pedal-svg{filter:drop-shadow(0 1.4vmin 1.8vmin rgba(0,0,0,.6))}
.ip-fire{overflow:hidden}.ip-fire .sr-x2{width:52%;height:52%;transform:none}
.ip-fire .sr-fly{position:absolute;left:50%;bottom:-10%;width:22%;margin-left:-11%;pointer-events:none;animation:ipfly .7s cubic-bezier(.5,0,.8,.4) forwards}
.ip-fire .sr-fly svg{width:100%;height:auto;display:block;color:#fff;transform:none;filter:drop-shadow(0 0 1vmin #ffb347)}
@keyframes ipfly{0%{transform:translateY(0) scale(.9);opacity:1}70%{opacity:1}100%{transform:translateY(-330%) scale(1.05);opacity:0}}
.ip-res{position:absolute;top:calc(max(3.4vmin,env(safe-area-inset-top)) + min(17vw,24vmin) + 1.6vmin);right:max(4vmin,env(safe-area-inset-right));width:min(17vw,24vmin);display:flex;justify-content:center;align-items:flex-end;gap:.8vmin;color:#ff6a3c}
.ip-res svg{width:4vmin;height:4.6vmin;filter:drop-shadow(0 0 .8vmin rgba(255,90,60,.7))}.ip-res b{font:italic 900 3.4vmin "Exo 2",sans-serif;color:#ffb08f}
.ip-row{gap:0}.ip-ped{height:58vmin;margin:0 -2vmin 2vmin}.ip-ped .sr-pedal-svg{height:100%}.ip-wbox{z-index:1}
.ip-ped{height:62vmin}
.ip-fire{display:flex;align-items:center;justify-content:center;gap:2.4vmin}
.ip-fire .sr-slot{display:block;width:4.4vmin;height:9.6vmin;opacity:0;transform:translateY(170%)}
.ip-fire .sr-slot svg{display:block;width:100%;height:100%;overflow:visible;transform:none;filter:none}
.ip-fire .sr-slot .fl{opacity:0}.ip-fire .sr-slot.on{opacity:1;transform:none}
.ip-fire .sr-slot.load{animation:iplo .5s cubic-bezier(.2,.9,.3,1) both}.ip-fire .sr-slot.fly{animation:ipfu .52s cubic-bezier(.55,0,.9,.35) forwards}.ip-fire .sr-slot.fly .fl{opacity:1}
@keyframes iplo{from{transform:translateY(170%);opacity:.3}to{transform:none;opacity:1}}
@keyframes ipfu{0%{transform:none;opacity:1}80%{opacity:1}100%{transform:translateY(-260%);opacity:0}}
.ip-res{overflow:hidden;height:6vmin}.ip-res svg.sink{animation:ipsk .45s ease-in forwards}@keyframes ipsk{to{transform:translateY(180%);opacity:0}}
/* 3g — bố cục B */
.ip-row{position:absolute;inset:0;left:0;bottom:0;transform:none;height:auto;display:block}
.ip-ped{position:absolute;bottom:4vh;margin:0}
.ip-gas{left:5vw;height:54vh}.ip-brk{right:5vw;height:46vh}
.ip-wbox{position:absolute;left:50%;bottom:0;width:66vh;height:66vh;margin-left:-33vh}
.ip-wheel{width:66vh;height:66vh;margin-left:-33vh;bottom:-9.6vh}
.ip-fire{top:6vh;right:5vw;width:17vh;height:17vh}.ip-res{top:25vh;right:5vw;width:17vh}
/* 3s — A2: phanh trái · ga phải · cả dải trên = tên lửa */
.ip-gas{left:auto;right:5vw}.ip-brk{right:auto;left:5vw}
.ip-row{pointer-events:none}.ip-row>*{pointer-events:auto}
.ip-fire{top:0;left:0;right:0;width:auto;height:30%;aspect-ratio:auto;border-radius:0;z-index:2;color:#7c4a3a;gap:3vmin;animation:none;
  background:linear-gradient(180deg,rgba(255,110,50,0) 0,rgba(255,110,50,.05) 100%);box-shadow:inset 0 -.5vmin 0 rgba(124,45,18,.8)}
.ip-fire.ready{background:linear-gradient(180deg,rgba(255,110,50,.03) 0,rgba(255,110,50,.2) 100%);box-shadow:inset 0 -.6vmin 0 #ff7a4a,inset 0 -5vh 7vh rgba(255,90,40,.28);animation:ipf3 .9s ease-in-out infinite alternate}
@keyframes ipf3{to{box-shadow:inset 0 -.6vmin 0 #ff7a4a,inset 0 -2vh 4vh rgba(255,90,40,.12)}}
.ip-fire.hit{transform:none}
.ip-fire .sr-slot{position:relative;bottom:auto;width:6vmin;height:13vmin}   /* 3m: luật cũ ".ip-fire span{position:absolute}" làm 2 quả CHỒNG lên nhau */
.ip-fhint{position:absolute;top:50%;transform:translateY(-50%);font:italic 900 max(16px,3.2vmin) "Exo 2",sans-serif;letter-spacing:.2em;color:rgba(255,150,100,.3);display:flex;align-items:center;gap:1.2vmin;pointer-events:none}
.ip-fhint.l{left:max(5vw,env(safe-area-inset-left))}.ip-fhint.r{right:max(5vw,env(safe-area-inset-right))}
.ip-fhint svg{width:3.4vmin;height:3.4vmin;transform:none}
.ip-fire.ready .ip-fhint{color:#ffc9a8;text-shadow:0 0 2vmin rgba(255,110,50,.8)}
.ip-fcap{position:absolute;left:0;right:0;bottom:1.4vh;text-align:center;font:800 max(11px,1.8vmin) "Exo 2",sans-serif;letter-spacing:.2em;color:#64748b;font-style:normal;pointer-events:none}
.ip-fire.ready .ip-fcap{color:#fdba74}
.ip-rip{position:absolute;width:16vmin;height:16vmin;margin:-8vmin 0 0 -8vmin;border-radius:50%;border:.6vmin solid #ffb347;pointer-events:none;animation:iprip .55s ease-out forwards}
@keyframes iprip{from{transform:scale(.25);opacity:1}to{transform:scale(1.6);opacity:0}}
.ip-res{top:calc(15% - 3vmin);left:calc(50% + 9vmin);right:auto;width:auto;z-index:3;pointer-events:none;justify-content:flex-start}
.ip-warn{top:2.2vh;z-index:3}
.ip[data-m="2"] .ip-top{left:50%;top:31.6%;transform:translateX(-50%)}
.ip-lvl{height:max(36px,4.6vmin);padding:0 1.8vmin;border-radius:99px;border:1px solid rgba(140,210,255,.4);background:rgba(255,255,255,.06);color:#cbd5e1;font:800 max(13px,1.7vmin) "Exo 2",sans-serif;letter-spacing:.1em;cursor:pointer}
.ip-lvl{display:none!important}   /* 4f: mốc cân bằng tự lấy — bỏ nút LEVEL */
.ip-tiltgo{position:absolute;left:50%;top:22%;transform:translateX(-50%);z-index:4;display:none;padding:2vmin 4vmin;border-radius:99px;border:0;background:var(--tc);color:#fff;
  font:italic 900 max(16px,3vmin) "Exo 2",sans-serif;letter-spacing:.12em;box-shadow:0 0 4vmin var(--tc);cursor:pointer;white-space:nowrap}
.ip[data-tilt="1"]:not([data-tiltok="1"]) .ip-tiltgo{display:block}
.ip[data-tilt="1"] .ip-wbox{cursor:default}
.ip[data-tilt="1"] .ip-wbox.l .ip-glow.l,.ip[data-tilt="1"] .ip-wbox.r .ip-glow.r{opacity:calc(.3 + var(--sa,0) * .65)}
/* 3t — dải phím trên cùng · khoảng cách · dải tên lửa · tên lửa con · boost mềm */
.ip[data-m="2"] .ip-top{left:0;right:0;top:0;transform:none;height:calc(max(50px,7.6vh) + env(safe-area-inset-top));padding:env(safe-area-inset-top) 3vw 0;box-sizing:border-box;
  justify-content:center;gap:1.6vmin;background:rgba(4,7,14,.82);border-bottom:1px solid rgba(140,210,255,.16)}
.ip[data-m="2"] .ip-team{font-size:max(18px,2.8vmin)}
.ip[data-m="2"] .ip-st{font-size:max(13px,1.8vmin)}
.ip[data-m="2"] .ip-mode{font-size:max(11px,1.4vmin);padding:.5vmin 1.2vmin}
.ip[data-m="2"] .ip-back{width:max(34px,4.4vmin);height:max(34px,4.4vmin)}
.ip-lvl{height:max(32px,4.2vmin);font-size:max(12px,1.5vmin)}
.ip-fire{top:calc(max(50px,7.6vh) + env(safe-area-inset-top) + 2.8vh);height:auto;bottom:70%;padding-bottom:6vmin;box-sizing:border-box}
.ip-fire .sr-slot{width:5vmin;height:10.8vmin}
.ip-fcap{display:none}
.ip-warn{top:calc(max(50px,7.6vh) + env(safe-area-inset-top) + 3.4vh)}
.ip-res{top:auto;bottom:calc(70% + 1.2vh);left:50%;right:auto;transform:translateX(-50%);overflow:visible;height:4.4vmin;width:auto;justify-content:center;align-items:flex-end}
.ip-res svg{width:3.2vmin;height:3.8vmin;transform-origin:50% 100%}
.ip-res svg.rise{animation:iprise .5s cubic-bezier(.3,.7,.4,1) forwards}
@keyframes iprise{0%{transform:none;opacity:1}100%{transform:translate(var(--dx,0),var(--dy,-7vmin)) scale(2.6);opacity:.15}}
.ip-fire .sr-slot.load{animation:iplo3 .45s cubic-bezier(.2,.9,.3,1) both}
@keyframes iplo3{from{transform:translateY(55%) scale(.4);opacity:.2}to{transform:none;opacity:1}}
.ip .sr-nfill{fill:url(#ip3tNit);transform:translateY(100%);transition:transform .5s cubic-bezier(.25,.8,.35,1)}
.ip-gas .sr-pedal-svg{transition:filter .6s ease}
.ip-nbar em{transition:transform .5s cubic-bezier(.25,.8,.35,1);border-radius:.8vmin;background:linear-gradient(90deg,#4ef0ff,#a77bff 82%,rgba(167,123,255,0));box-shadow:0 0 1.2vmin rgba(78,240,255,.45)}
/* 3u — mượt: vô lăng không transition, không filter trên khối xoay; bóng = lớp đứng yên */
.ip-drv .ip-wheel{transition:none!important;filter:none!important;will-change:transform;transform:translateZ(0)}
.ip-wshadow{position:absolute;left:50%;bottom:-13vh;width:62vh;height:62vh;margin-left:-31vh;border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(0,0,0,.62) 55%,rgba(0,0,0,.28) 78%,transparent 100%);transform:translateY(2.4vh)}
.ip-glow{mix-blend-mode:normal;will-change:opacity}
/* 3v — lái nghiêng nhẹ: không quầng sáng; vạch báo lái mảnh chỉ đổi transform */
.ip[data-tilt="1"] .ip-glow{display:none}
.ip-smeter{position:absolute;left:50%;top:37.5%;width:0;height:max(5px,.7vh);margin:0;display:none;pointer-events:none}
.ip[data-tilt="1"][data-m="2"] .ip-smeter{display:block}
/* 3w: lõi sáng ngắn giữa + 2 nhánh (trái / phải) giãn bằng scaleX, đuôi mờ dần; quầng = lớp dày hơn, nhạt, mặt nạ mờ trên dưới (tĩnh ⇒ vẽ 1 lần) */
.ip-smeter b{position:absolute;left:-2.4vh;width:4.8vh;top:0;bottom:0;border-radius:99px;
  background:linear-gradient(90deg,transparent,var(--tc) 28%,color-mix(in srgb,var(--tc) 40%,white) 50%,var(--tc) 72%,transparent)}
.ip-smeter b::before{content:"";position:absolute;left:-1vh;right:-1vh;top:-1.1vh;bottom:-1.1vh;border-radius:99px;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--tc) 55%,transparent),transparent)}
.ip-smeter i{position:absolute;top:0;bottom:0;width:24vh;border-radius:99px;transform:scaleX(0);will-change:transform}
.ip-smeter i.r{left:0;transform-origin:0 50%;background:linear-gradient(90deg,var(--tc) 0%,color-mix(in srgb,var(--tc) 85%,transparent) 40%,transparent 100%)}
.ip-smeter i.l{right:0;transform-origin:100% 50%;background:linear-gradient(270deg,var(--tc) 0%,color-mix(in srgb,var(--tc) 85%,transparent) 40%,transparent 100%)}
.ip-smeter i::before{content:"";position:absolute;left:0;right:0;top:-1vh;bottom:-1vh;border-radius:99px;background:inherit;opacity:.35;
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 50%,transparent);mask-image:linear-gradient(180deg,transparent,#000 50%,transparent)}
.ipc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4vmin;padding:4vmin;box-sizing:border-box}
.ipc h1{margin:0;font:italic 900 max(30px,6vmin) "Exo 2",sans-serif;letter-spacing:.08em;color:#fff3dd}
.ipc p{margin:0;font-size:max(17px,2.4vmin);color:#94a3b8}
.ipc-row{display:flex;gap:5vmin;flex-wrap:wrap;justify-content:center}
.ipc-b{width:min(38vmin,380px);aspect-ratio:1.2;border-radius:4vmin;border:3px solid var(--tc);background:rgba(255,255,255,.04);color:var(--tc);cursor:pointer;padding:0;
  font:italic 900 max(28px,5vmin) "Exo 2",sans-serif;letter-spacing:.1em;box-shadow:0 0 4vmin color-mix(in srgb,var(--tc) 30%,transparent)}
`;
const UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M3 3l18 18"/></svg>';
const TXT = { on: "Connected", relay: "SLOW link — reconnecting…", connecting: "Connecting…", nogame: "Waiting for the game" };   // 4f
const MODE = ["iPad off", "Answer on iPad", "Drive on iPad"];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let styled = false;
function style() { if (styled) return; styled = true; const st = document.createElement("style"); st.textContent = CSS; document.head.append(st); }
function noGestures(root) { ["contextmenu", "dblclick", "gesturestart", "touchmove"].forEach(ev => root.addEventListener(ev, e => e.preventDefault(), { passive: false })); }

export function mountPadApp(mount, { team, client, onBack, steer: steerCfg }) {
  style();
  const t = team ? 1 : 0, m = TEAM_META[t];
  mount.innerHTML = `<div class="ip" style="--tc:${m.color}" data-s="nogame" data-m="w" data-alarm="0">
    <div class="ip-top">${onBack ? `<button class="ip-back" aria-label="Choose team">${BACK}</button>` : ""}<b class="ip-team">${m.name}</b><span class="ip-st"><i></i><span></span></span><span class="ip-rtt"></span><span class="ip-mode"></span><button class="ip-lvl" type="button">⟲ LEVEL</button></div>
    <div class="ip-scr ip-wait"><div class="ip-msg"><b>RACING WORDS</b><span>Open RACING WORDS on the big screen — this iPad links by itself.</span></div></div>
    <div class="ip-scr ip-off"><div class="ip-msg">${OFF}<b>iPad is OFF</b><span>The big screen is playing without iPads.<br>Choose "Answer on iPad" or "Drive on iPad" with the iPad button on the big screen.</span></div></div>
    <div class="ip-scr ip-ans"><div class="ip-q"></div><div class="ip-a"></div><div class="ip-msg ip-ready"><b>GET READY</b><span>Questions show here when the race starts.</span></div></div>
    <div class="ip-scr ip-drv">
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ip3tNit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#46e6ff" stop-opacity="0"/><stop offset=".2" stop-color="#46e6ff" stop-opacity=".42"/><stop offset="1" stop-color="#46e6ff" stop-opacity=".6"/></linearGradient></defs></svg>
      <div class="ip-warn"></div>
      <button class="ip-fire" data-k="f" aria-label="Fire missile"><i class="ip-fhint l">${UP}FIRE</i>${FIRE_ICON}<i class="ip-fhint r">FIRE${UP}</i></button><div class="ip-res"></div>
      <div class="ip-smeter"><i class="l"></i><i class="r"></i><b></b></div>
      <div class="ip-row">
        <button class="ip-ped ip-gas" data-k="b" aria-label="Boost">${GAS_SVG}</button>
        <div class="ip-wbox"><button class="ip-tiltgo" type="button">TAP TO TURN ON TILT</button><i class="ip-wshadow"></i><div class="ip-wheel">${WHEEL_FULL}
          <div class="ip-scrn"><div class="ip-src">iPAD</div><div class="ip-kmh"><span>0</span><small>km/h</small></div><div class="ip-cells"><i></i><i></i><i></i><i></i></div><div class="ip-nbar"><em></em></div></div></div></div>
        <button class="ip-ped ip-brk" data-k="k" aria-label="Brake">${BRAKE_SVG}</button>
      </div>
    </div></div>`;
  const root = mount.firstElementChild, $ = s => root.querySelector(s);
  const wbox = $(".ip-wbox"), wheel = $(".ip-wheel"), gas = $(".ip-gas"), brk = $(".ip-brk"), fireB = $(".ip-fire");
  // ---- lái: nhiều ngón cùng lúc, mỗi pointerId 1 việc ----
  const held = new Map();
  let steerVis = 0;
  // 3s: kiểu lái do màn lớn chọn — "touch" (giữ nửa vô lăng, như 3m) | "tilt" (nghiêng iPad)
  const WVIS = 0.32;                                         // 3x: nghiêng hết cỡ ⇒ vô lăng vẽ xoay ≈ 22° (3w: 0,22 ≈ 15°)
  const SC = { mode: "touch", max: 25, dead: 0, curve: 1, smooth: 6 };           // 3x: độ mượt 20 ⇒ 6 % (nhạy hơn); 3v: không vùng chết, tuyến tính          // 3v: thầy "không thích bị khoá nhẹ ở giữa" ⇒ không vùng chết, tuyến tính
  const ST = { t0: performance.now(), frames: 0, worst: 0, sends: 0, ev: 0, evGap: 0, out: { fps: 0, worst: 0, hz: 0, gap: 0, sends: 0 } };   // 3u: số đo mỗi giây
  let tiltOn = false, tiltSteer = 0, tiltRaw = 0, sentAt = 0, lastSteer = 0;
  const send = () => {
    const v = [...held.values()], boost = v.includes("b"), brake = v.includes("k");
    const steer = tiltOn ? tiltSteer : (v.includes("r") ? 1 : 0) - (v.includes("l") ? 1 : 0);
    client.drive(steer, boost, brake); sentAt = performance.now(); lastSteer = steer; ST.sends++;
    if (!tiltOn) { wbox.classList.toggle("l", v.includes("l")); wbox.classList.toggle("r", v.includes("r")); }   // 3v: nghiêng ⇒ KHÔNG đổi lớp trên khung cha (vẽ lại cả cây)
    gas.classList.toggle("on", boost); brk.classList.toggle("on", brake);
    steerVis = tiltOn ? steer * WVIS : steer;               // 3t: nghiêng ⇒ vô lăng vẽ vẫn xoay NHẸ cùng chiều (≈ 15° khi hết cỡ) cho có cảm giác
  };
  const bind = (el, kindOf) => {
    el.addEventListener("pointerdown", e => { e.preventDefault(); const k0 = kindOf(e); if (!k0) return; try { el.setPointerCapture(e.pointerId); } catch (x) { /* */ } held.set(e.pointerId, k0); send(); });
    el.addEventListener("pointermove", e => { if (!held.has(e.pointerId)) return; const k = kindOf(e); if (k && k !== held.get(e.pointerId)) { held.set(e.pointerId, k); send(); } });
    const up = e => { if (held.delete(e.pointerId)) send(); };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => el.addEventListener(n, up));
  };
  bind(wbox, e => {                                        // chỉ trong vòng tròn vô lăng (+12 %) · lái nghiêng ⇒ vô lăng không nhận chạm
    if (tiltOn) return null;
    const r = wheel.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), rad = wheel.offsetWidth / 2 * 1.12;
    return dx * dx + dy * dy <= rad * rad ? (dx < 0 ? "l" : "r") : null; });
  bind(gas, () => "b"); bind(brk, () => "k");
  let msN = 0, msShown = -1, msHold = 0;
  const slots = [...fireB.querySelectorAll(".sr-slot")], busy = [0, 0], resEl = $(".ip-res");
  const paintSlots = () => { const now = performance.now(), ready = Math.min(msN, 2);
    slots.forEach((sl, j) => { if (now < busy[j]) return; const on = j < ready, was = sl.classList.contains("on");
      if (on && !was) { sl.classList.remove("load"); void sl.offsetWidth; sl.classList.add("on", "load"); } else if (!on && was) sl.classList.remove("on", "load"); });
    if (msShown !== msN && now > msHold) { msShown = msN; resEl.innerHTML = reserveHTML(Math.max(0, msN - 2)); } };
  fireB.addEventListener("pointerdown", e => {                // như game: chính quả trong nút bay; còn kho ⇒ icon chờ thụt xuống + quả mới trồi lên
    e.preventDefault();
    const fr = fireB.getBoundingClientRect(), rip = document.createElement("span");          // 3s: gợn sóng ở đúng chỗ ngón cái chạm (cả khi hết tên lửa, để biết đã chạm)
    rip.className = "ip-rip"; rip.style.left = (e.clientX - fr.left) + "px"; rip.style.top = (e.clientY - fr.top) + "px";
    if (msN <= 0) rip.style.borderColor = "#64748b";
    fireB.append(rip); setTimeout(() => rip.remove(), 600);
    if (msN <= 0) return; client.send("fire"); fireB.classList.add("hit"); setTimeout(() => fireB.classList.remove("hit"), 160);
    const n = msN, j = Math.min(n, 2) - 1, sl = slots[j], reload = n >= 3, now = performance.now();
    busy[j] = now + 1100; sl.classList.remove("load"); void sl.offsetWidth; sl.classList.add("fly");
    if (reload) {                                             // 3t: tên lửa con cuối hàng BAY LÊN đúng chỗ quả to vừa phóng
      msHold = now + 700; const ic = resEl.querySelectorAll("svg"), last = ic[ic.length - 1];
      if (last) { const a = last.getBoundingClientRect(), b = sl.getBoundingClientRect();
        last.style.setProperty("--dx", (b.left + b.width / 2 - (a.left + a.width / 2)).toFixed(0) + "px");
        last.style.setProperty("--dy", (b.top + b.height * 0.85 - a.bottom).toFixed(0) + "px"); last.classList.add("rise"); }
    }
    setTimeout(() => { sl.classList.remove("fly"); if (reload) { void sl.offsetWidth; sl.classList.add("on", "load"); } else sl.classList.remove("on"); }, 520);
    msN = n - 1; setTimeout(() => { msShown = -1; paintSlots(); }, 720);
  });
  // vô lăng quay mượt theo tay (như game: 70° khi bẻ hết)
  let wv = 0, raf = 0;
  let tl = performance.now(), wvShown = 1e9, smShown = 9;
  const smL = root.querySelector(".ip-smeter i.l"), smR = root.querySelector(".ip-smeter i.r");
  const spin = now => {
    const dt = Math.min(0.05, Math.max(0, (now - tl) / 1000)); tl = now;
    if (tiltOn) {
      // 3w: tới góc hết cỡ = KNEE (88 %); nghiêng quá nữa vẫn lái thêm được, càng nghiêng càng ít (tiến dần về 100 %) — như cố thêm vô lăng thật
      const a = TILT.phi, sg = Math.sign(a), A = Math.abs(a) - SC.dead, span = Math.max(1, SC.max - SC.dead), KNEE = 0.88;
      const v = A <= 0 ? 0 : A <= span ? KNEE * Math.pow(A / span, SC.curve) : KNEE + (1 - KNEE) * (1 - Math.exp(-(A - span) / 12));
      tiltRaw = sg * v;
      const sm = SC.smooth / 100; tiltSteer += (tiltRaw - tiltSteer) * (sm <= 0 ? 1 : 1 - Math.pow(sm, dt * 20 + 1e-4));
      if (Math.abs(tiltSteer) < 0.004) tiltSteer = 0;
      const t = performance.now();
      if (root.dataset.m === "2" && (Math.abs(tiltSteer - lastSteer) > 0.01 && t - sentAt > 30 || t - sentAt > 120)) send();   // ≤ ~30 lần/giây
    }
    // 3u: nghiêng ⇒ góc lấy THẲNG độ lái đã lọc, từng khung (không chờ nhịp gửi); chạm ⇒ như cũ
    const target = (tiltOn ? tiltSteer * WVIS : steerVis) * 70;
    if (tiltOn && Math.abs(tiltSteer - smShown) > 0.003) { smShown = tiltSteer;                                   // 3w: nhánh bên đang lái dài ra
      smR.style.transform = `scaleX(${Math.max(0, tiltSteer).toFixed(3)})`; smL.style.transform = `scaleX(${Math.max(0, -tiltSteer).toFixed(3)})`; }
    wv += (target - wv) * (tiltOn ? 0.9 : 0.35);                // 3x: nghiêng ⇒ bám gần như tức thì
    if (Math.abs(wv - wvShown) > 0.04) { wvShown = wv; wheel.style.transform = `translateZ(0) rotate(${wv.toFixed(2)}deg)`; }
    ST.frames++; ST.worst = Math.max(ST.worst, dt * 1000);
    if (now - ST.t0 >= 1000) { const k = 1000 / (now - ST.t0); ST.out = { fps: Math.round(ST.frames * k), worst: Math.round(ST.worst), hz: Math.round(ST.ev * k), gap: Math.round(ST.evGap), sends: Math.round(ST.sends * k) }; ST.t0 = now; ST.frames = ST.sends = ST.ev = 0; ST.worst = ST.evGap = 0; }
    raf = requestAnimationFrame(spin);
  };
  raf = requestAnimationFrame(spin);
  // ---- trả lời ----
  const ansEl = $(".ip-ans"), qEl = $(".ip-q"), aEl = $(".ip-a"), readyEl = $(".ip-ready");
  let q = null;
  aEl.addEventListener("pointerdown", e => {
    const b = e.target.closest("button"); if (!b || !q || q.lock || aEl.classList.contains("lock")) return;
    e.preventDefault(); aEl.classList.add("lock"); client.answer(+b.dataset.k, q.n);
  });
  function paintQ() {
    const live = q && q.ph === "race" && q.q;
    ansEl.classList.toggle("is-shown", !!live && root.dataset.m === "1");
    qEl.style.display = aEl.style.display = live ? "" : "none"; readyEl.style.display = live ? "none" : "";
    readyEl.querySelector("b").textContent = q && q.ph === "end" ? "RACE OVER" : q && q.ph === "count" ? "3 · 2 · 1…" : "GET READY";
    if (!live) return;
    const n = q.q.length;
    qEl.textContent = q.q; qEl.dataset.len = n > 90 ? "xl" : n > 55 ? "l" : "";
    if (aEl.dataset.qn !== String(q.n)) { aEl.dataset.qn = String(q.n); aEl.dataset.n = q.a.length; aEl.innerHTML = q.a.map((a, k) => `<button type="button" data-k="${k}">${esc(a)}</button>`).join(""); }
    const bs = aEl.querySelectorAll("button");
    bs.forEach((b, k) => { b.classList.toggle("ok", q.pick === k && !!q.ok); b.classList.toggle("bad", q.pick === k && !q.ok); b.classList.toggle("rev", (q.rev || []).includes(k)); });
    aEl.classList.toggle("lock", !!q.lock);
  }
  // ---- 3s: cảm biến nghiêng (giống trang thử thu-nghieng-3s.html) ----
  const TILT = { phi: 0, ok: false, ev: 0, debug: null };
  let gl = null, ref = null, phiAcc = 0, lastEvT = 0, gyroAx = null, gyroSign = 1, learn = 0, drift = 0, relearn = 0;
  const corrAx = { alpha: 0, beta: 0, gamma: 0 }, AXN = { alpha: "α", beta: "β", gamma: "γ" };
  const onMotion = e => {
    if (TILT.debug != null) return;
    const g = e.accelerationIncludingGravity; if (!g || g.x == null || g.y == null) return;
    TILT.ev++; ST.ev++;
    const now = performance.now(), dt = lastEvT ? Math.min(0.1, (now - lastEvT) / 1000) : 0; if (lastEvT) ST.evGap = Math.max(ST.evGap, now - lastEvT); lastEvT = now;
    gl = gl ? { x: gl.x + (g.x - gl.x) * 0.5, y: gl.y + (g.y - gl.y) * 0.5 } : { x: g.x, y: g.y };   // 3x: lọc 0,3 ⇒ 0,5 (bớt trễ khi chưa có con quay)
    const m = Math.hypot(gl.x, gl.y);
    if (!TILT.ok) { TILT.ok = true; root.dataset.tiltok = "1"; }   // 4f: có sự kiện ⇒ Safari đã cho phép ⇒ bật luôn
    if (!ref && m > 4) ref = levelRef();
    if (!ref || m < 1) return;
    const nx = gl.x / m, ny = gl.y / m, prev = phiAcc;
    phiAcc = Math.atan2(ref.x * ny - ref.y * nx, ref.x * nx + ref.y * ny) * 180 / Math.PI;
    const rr = e.rotationRate;
    // 3v: dò xem trục nào của rotationRate (α/β/γ) đi cùng góc gia tốc, chiều nào — đủ 25° chuyển động thì chốt; trước đó chỉ dùng gia tốc
    if (rr && dt > 0 && !gyroAx) {
      const dA = phiAcc - prev; learn += Math.abs(dA);
      for (const k of ["alpha", "beta", "gamma"]) if (rr[k] != null) corrAx[k] += dA * rr[k] * dt;
      if (learn > 15) {                                        // 3x: 25° ⇒ 15° chuyển động là đủ dò
        const ks = Object.keys(corrAx).sort((a, b) => Math.abs(corrAx[b]) - Math.abs(corrAx[a]));
        if (Math.abs(corrAx[ks[0]]) > 2 * Math.abs(corrAx[ks[1]]) && Math.abs(corrAx[ks[0]]) > 5) { gyroAx = ks[0]; gyroSign = Math.sign(corrAx[ks[0]]); TILT.phi = phiAcc; }
        else { learn = 0; corrAx.alpha = corrAx.beta = corrAx.gamma = 0; }   // chưa rõ ⇒ dò lại
      }
    }
    if (gyroAx && rr && rr[gyroAx] != null && dt > 0) {
      TILT.phi = (TILT.phi + gyroSign * rr[gyroAx] * dt) * 0.98 + phiAcc * 0.02;
      // 3x: tự kiểm — góc con quay lệch góc gia tốc > 6° kéo dài ~1 s ⇒ chốt nhầm trục ⇒ dò lại
      drift = drift * 0.985 + Math.abs(TILT.phi - phiAcc) * 0.015;
      if (drift > 6) { gyroAx = null; learn = 0; corrAx.alpha = corrAx.beta = corrAx.gamma = 0; drift = 0; TILT.phi = phiAcc; relearn++; }
    } else TILT.phi = phiAcc;
  };
  // 4f: MỐC CÂN BẰNG TUYỆT ĐỐI — iPad cầm ngang như vô lăng, đặt thẳng thì trọng lực nằm dọc trục x của máy (cầm dọc: trục y).
  //   Chỉ lấy CHIỀU (±) từ cảm biến; góc thì luôn so với đúng trục ⇒ bật nghiêng lúc đang cầm lệch vẫn đúng, không cần LEVEL.
  const landscape = () => { const o = screen.orientation && screen.orientation.type; if (o) return o.startsWith("landscape"); if (window.orientation != null) return Math.abs(+window.orientation) === 90; return innerWidth > innerHeight; };
  function levelRef() {
    if (!gl) return null;
    const land = landscape(), v = land ? gl.x : gl.y;
    if (Math.abs(v) < 2) { return Math.abs(gl.x) > Math.abs(gl.y) ? { x: Math.sign(gl.x), y: 0 } : { x: 0, y: Math.sign(gl.y || 1) }; }   // gần nằm phẳng ⇒ trục gần nhất
    return land ? { x: Math.sign(v), y: 0 } : { x: 0, y: Math.sign(v) };
  }
  const level = () => { ref = null; gyroAx = null; learn = 0; corrAx.alpha = corrAx.beta = corrAx.gamma = 0; };   // lấy lại mốc ở sự kiện kế
  const onOrient = () => level();
  window.addEventListener("orientationchange", onOrient); if (screen.orientation) screen.orientation.addEventListener("change", onOrient);
  window.addEventListener("devicemotion", onMotion);   // 4f: Safari đã cho phép từ trước ⇒ có sự kiện ngay, khỏi chạm nút
  async function tiltStart() {
    try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function" && (await DeviceMotionEvent.requestPermission()) !== "granted") { $(".ip-tiltgo").textContent = "ALLOW MOTION IN SAFARI, THEN RELOAD"; return; } }
    catch (e) { $(".ip-tiltgo").textContent = "TILT NEEDS HTTPS"; return; }
    window.addEventListener("devicemotion", onMotion); TILT.ok = true; root.dataset.tiltok = "1"; ref = null;
  }
  $(".ip-tiltgo").addEventListener("click", tiltStart);
  $(".ip-lvl").addEventListener("click", level);
  function setSteer(cfg) {
    Object.assign(SC, cfg || {});
    tiltOn = SC.mode === "tilt"; root.dataset.tilt = tiltOn ? "1" : "0";
    $(".ip-src").textContent = tiltOn ? "TILT" : "iPAD";
    const sv = wheel.querySelector("svg"), want = tiltOn ? "lite" : "full";          // 3v: nghiêng ⇒ vô lăng nhẹ (không filter); chạm ⇒ vô lăng đủ nét sáng
    if (sv && sv.dataset.v !== want) { sv.outerHTML = (tiltOn ? WHEEL_LITE : WHEEL_FULL).replace("<svg ", `<svg data-v="${want}" `); }
    if (tiltOn) wbox.classList.remove("l", "r");
    $(".ip-mode").textContent = root.dataset.m === "2" ? (tiltOn ? "Tilt steering" : MODE[2]) : (MODE[+root.dataset.m] || "");
    if (!tiltOn) tiltSteer = 0;
    send();
  }
  setSteer(steerCfg);
  const paintCap = () => {};                               // 3t: bỏ chữ dưới dải tên lửa (chỗ đó là hàng tên lửa con)
  paintCap();
  root.querySelector(".ip-back")?.addEventListener("click", () => { cancelAnimationFrame(raf); window.removeEventListener("devicemotion", onMotion); window.removeEventListener("orientationchange", onOrient); onBack(); });
  noGestures(root);
  let lock = null;
  const keep = async () => { if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return; try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch (e) { /* */ } };
  keep(); document.addEventListener("visibilitychange", keep); root.addEventListener("pointerdown", keep, { once: true });
  return {
    setState({ s, rtt }) {
      root.dataset.s = s;
      $(".ip-st > span").textContent = TXT[s] || "";
      $(".ip-rtt").textContent = s === "on" && rtt ? rtt + " ms" : "";
      if (s === "nogame") root.dataset.m = "w";
    },
    setMode(mode) {
      root.dataset.m = String(mode); $(".ip-mode").textContent = mode === 2 && tiltOn ? "Tilt steering" : MODE[mode] || "";
      if (mode !== 2 && held.size) { held.clear(); send(); }
      paintQ();
    },
    setQ(v) { q = v; paintQ(); },
    stats: () => ({ ...ST.out, gyro: (gyroAx ? AXN[gyroAx] + (gyroSign > 0 ? "+" : "−") : "learning") + (relearn ? " ↻" + relearn : "") }),
    setSteer, level, get steer() { return { ...SC, value: tiltOn ? tiltSteer : lastSteer, phi: TILT.phi, ok: TILT.ok, ev: TILT.ev }; },
    tiltDebug(deg) { TILT.debug = deg; if (deg != null) { TILT.phi = deg; if (!TILT.ok) { TILT.ok = true; root.dataset.tiltok = "1"; } } },   // bàn thử: giả góc nghiêng
    setInfo(i) {
      $(".ip-kmh span").textContent = i.kmh;
      root.querySelectorAll(".ip-cells i").forEach((c, k) => c.style.setProperty("--f", Math.max(0, Math.min(1, i.cells - k)).toFixed(2)));
      $(".ip-nbar em").style.transform = `scaleX(${(i.nitro || 0).toFixed(2)})`;
      $(".ip-gas .sr-nfill").style.transform = `translateY(${((1 - Math.max(0, Math.min(1, i.nitro || 0))) * 100).toFixed(1)}%)`; gas.classList.toggle("nitro", (i.nitro || 0) > 0.01);   // 3t: trôi mượt (transition), mép mờ
      msN = i.ms; paintSlots(); paintCap(); fireB.classList.toggle("ready", i.ms > 0 && i.phase === "race");
      root.dataset.alarm = String(root.dataset.m === "2" ? i.alarm || 0 : 0);
      $(".ip-warn").textContent = i.alarm === 2 ? "DODGE!" : i.alarm === 1 ? "⚠ MISSILE" : "";
    },
  };
}

export function mountPadChooser(mount, { onPick }) {
  style();
  mount.innerHTML = `<div class="ipc"><h1>RACING WORDS · iPad</h1><p>Choose this iPad's team</p>
    <div class="ipc-row">${[0, 1].map(t => `<button class="ipc-b" data-t="${t}" style="--tc:${TEAM_META[t].color}">${TEAM_META[t].name}</button>`).join("")}</div>
    <p>The big screen decides what this iPad does: answer the questions, or be the steering wheel.</p></div>`;
  mount.querySelectorAll(".ipc-b").forEach(b => b.addEventListener("click", () => onPick(+b.dataset.t)));
  noGestures(mount.firstElementChild);
}
