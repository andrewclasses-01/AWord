// =============================================================
// core/loader3d.js — MÀN CHỜ cho game 3D tự vẽ trọn màn (Đợt 451, thầy 03/10/2026: "khi khởi động game STAR LOOT
// có hình này một lát khá xấu… tạo một màn loading").
// ⭐ Đợt 452 (thầy 03/10/2026: "làm màn hình load khác đẹp và ngầu hơn… STAR LOOT cần có cảnh tàu, hành tinh, lỗ không gian
// thật ngầu; TRAIN RUSH cần có cảnh 2 tàu đua nhau, nền có chim đuổi nhau và cảnh hoàng hôn đẹp. Tất cả đều cần có thêm chữ
// ANDREW STUDIO đẹp, tinh tế ở một vị trí cân đối"): mỗi theme là một CẢNH ĐỘNG dựng bằng HTML + SVG:
//   • space (STAR LOOT): nền sao 2 lớp trôi, tinh vân, LỖ KHÔNG GIAN (đĩa xoáy nghiêng 3 lớp + vành sáng + lõi đen),
//     3 phi thuyền lao vào lỗ (vệt lửa), hành tinh vành đai + hành tinh xanh, sao băng, tàu mẹ xa.
//   • west (TRAIN RUSH): trời hoàng hôn, mặt trời + tia nắng xoay, mây, núi mesa 2 lớp, 2 đàn chim vỗ cánh đuổi nhau, 2 đoàn tàu
//     (đỏ / xanh) đua trên 2 đường ray — tà vẹt + xương rồng chạy lùi, bánh xe quay, khói phụt, hai tàu thay nhau dẫn.
//   • ANDREW STUDIO: dòng chữ nhỏ giãn rộng, ngay TRÊN tên game (studio · tên game · thanh chạy · LOADING thành một cột cân).
// ⛔⛔ MỌI chuyển động CHỈ dùng `transform` / `opacity` (trình duyệt chạy ở luồng vẽ riêng): lúc màn chờ hiện, luồng chính bận cứng
// 1–2 s dựng cảnh 3D — animation nào đụng layout / background-position / filter sẽ ĐỨNG HÌNH đúng lúc thầy nhìn.
// Hiện NGAY từ `tpl.startScreen` (engine gọi đồng bộ lúc dựng màn READY ⇒ khung đầu tiên đã là màn chờ), giữ qua mount, tự mờ đi
// khi game báo xong (`done()`). Một màn chờ cho mỗi `key` — gọi show() lần nữa chỉ trả lại đúng màn đang hiện.
//   const ld = showLoader3d({ key: "starloot", title: "STAR LOOT", theme: "space" | "west" });  …  ld.done();
// ⚠️ z-index 1001: TRÊN ô game (.aw-sl-host / .aw-tr-host = 1000) — game dựng xong dưới màn chờ rồi mới lộ ra.
// ⚠️ Lưới an toàn: tự mờ sau 25 s dù không ai gọi done() (game lỗi giữa chừng không được kẹt màn chờ mãi).
// =============================================================

const live = new Map();   // key → handle

const CSS = `
/* Đợt 452 — Rye khai THẲNG file phông (bỏ một vòng tải file CSS của Google Fonts): màn chờ TRAIN RUSH hiện là phông bắt đầu tải,
   chữ tên game kịp hiện sớm hơn ở máy chưa lưu phông. Cùng file Google Fonts trả về cho family=Rye (latin, v17). */
@font-face { font-family: "Rye"; font-style: normal; font-weight: 400; font-display: block;
  src: url(https://fonts.gstatic.com/s/rye/v17/r05XGLJT86YzEZ7t.woff2) format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
.aw-ld3d { position: fixed; inset: 0; z-index: 1001; overflow: hidden; display: grid; place-items: center;
  transition: opacity .5s ease; font-family: "Baloo 2", system-ui, sans-serif; user-select: none; -webkit-user-select: none; contain: strict; }
.aw-ld3d.is-out { opacity: 0; pointer-events: none; }
.aw-ld3d * { box-sizing: border-box; }
.aw-ld3d .l { position: absolute; pointer-events: none; }
.aw-ld3d .a { will-change: transform; }
.aw-ld3d svg { display: block; width: 100%; height: 100%; overflow: visible; }
/* ---- cột chữ: ANDREW STUDIO · tên game · thanh chạy · LOADING */
.aw-ld3d-in { position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; gap: 2vmin; }
.aw-ld3d-studio { display: flex; align-items: center; gap: 1.6vmin; font-weight: 600; font-size: clamp(11px, 1.75vmin, 20px);
  letter-spacing: .62em; padding-left: .62em; color: var(--ld-studio); white-space: nowrap; }
.aw-ld3d-studio i { display: block; width: clamp(24px, 7vmin, 90px); height: 1px; background: linear-gradient(90deg, transparent, var(--ld-studio)); }
.aw-ld3d-studio i:last-child { transform: scaleX(-1); }
.aw-ld3d-t { font-weight: 800; font-size: clamp(34px, 10vmin, 132px); letter-spacing: .06em; line-height: 1; text-align: center; white-space: nowrap;
  background: var(--ld-tt); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 2.2vmin var(--ld-glow)); opacity: 0; transition: opacity .35s ease; }
/* chữ chỉ hiện khi phông của game đã nạp (không nhảy từ phông tạm sang Baloo/Rye giữa chừng) */
.aw-ld3d.is-font .aw-ld3d-t { opacity: 1; }
.aw-ld3d-bar { position: relative; width: clamp(180px, 34vmin, 420px); height: 5px; margin-top: .8vmin; border-radius: 99px; overflow: hidden; background: var(--ld-track); }
.aw-ld3d-bar i { position: absolute; top: 0; bottom: 0; left: 0; width: 38%; border-radius: inherit; background: var(--ld-bar);
  box-shadow: 0 0 12px var(--ld-glow); will-change: transform; animation: ld-run 1.25s cubic-bezier(.45,.05,.55,.95) infinite; }
.aw-ld3d-s { font-weight: 700; font-size: clamp(11px, 1.6vmin, 18px); letter-spacing: .5em; padding-left: .5em; color: var(--ld-sub); }
@keyframes ld-run { 0% { transform: translateX(-105%); } 100% { transform: translateX(268%); } }
@keyframes ld-spin { to { transform: rotate(360deg); } }

/* ===================== SPACE — STAR LOOT ===================== */
.aw-ld3d.is-space { place-items: end center; background: radial-gradient(ellipse at 50% 46%, #1c1240 0%, #0b0820 45%, #04030b 100%);
  --ld-tt: linear-gradient(180deg, #ffffff 0%, #d9defe 50%, #8c93ff 100%); --ld-glow: rgba(125,140,255,.6);
  --ld-track: rgba(125,211,252,.16); --ld-bar: linear-gradient(90deg, #38bdf8, #a78bfa); --ld-sub: #93c5fd; --ld-studio: #c7d2fe; }
.sp-neb { inset: -20%; background:
  radial-gradient(ellipse 38% 28% at 24% 30%, rgba(124,58,237,.34), transparent 70%),
  radial-gradient(ellipse 34% 26% at 78% 70%, rgba(14,116,144,.32), transparent 70%),
  radial-gradient(ellipse 30% 22% at 70% 22%, rgba(219,39,119,.18), transparent 70%),
  radial-gradient(ellipse 26% 30% at 30% 78%, rgba(59,130,246,.16), transparent 70%);
  animation: ld-spin 90s linear infinite; }
.sp-stars { left: 0; top: 0; width: 200%; height: 100%; }
.sp-stars.s1 { opacity: .9; animation: sp-drift 70s linear infinite; background-image:
  radial-gradient(1.4px 1.4px at 12px 18px, #fff, transparent), radial-gradient(1px 1px at 71px 133px, #dbeafe, transparent),
  radial-gradient(1.2px 1.2px at 151px 61px, #fff, transparent), radial-gradient(1px 1px at 201px 171px, #e9d5ff, transparent),
  radial-gradient(1.6px 1.6px at 251px 33px, #fff, transparent), radial-gradient(1px 1px at 101px 211px, #fff, transparent);
  background-size: 280px 240px; }
.sp-stars.s2 { opacity: .55; animation: sp-drift 140s linear infinite; background-image:
  radial-gradient(1px 1px at 40px 90px, #fff, transparent), radial-gradient(.8px .8px at 130px 20px, #c7d2fe, transparent),
  radial-gradient(1px 1px at 190px 140px, #fff, transparent), radial-gradient(.8px .8px at 90px 180px, #fff, transparent);
  background-size: 220px 200px; }
@keyframes sp-drift { to { transform: translateX(-50%); } }
.aw-ld3d.is-space .aw-ld3d-in { margin-bottom: 9vh; }
/* lỗ không gian: đĩa xoáy nghiêng (phối cảnh) + vành sáng + lõi đen */
.sp-hole { left: 50%; top: 38%; width: 92vmin; height: 92vmin; margin: -46vmin 0 0 -46vmin; }
.sp-glow { inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(168,85,247,.42) 0%, rgba(99,102,241,.22) 26%, rgba(56,189,248,.08) 46%, transparent 66%);
  animation: sp-pulse 3.2s ease-in-out infinite; }
@keyframes sp-pulse { 0%, 100% { transform: scale(.94); opacity: .85; } 50% { transform: scale(1.06); opacity: 1; } }
.sp-tilt { inset: 0; transform: perspective(900px) rotateX(64deg); }
.sp-disk { inset: 6%; border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(56,189,248,0) 0deg, rgba(56,189,248,.85) 40deg, rgba(167,139,250,.2) 90deg, rgba(244,114,182,.75) 150deg,
    rgba(99,102,241,0) 200deg, rgba(125,211,252,.8) 260deg, rgba(192,132,252,.15) 310deg, rgba(56,189,248,0) 360deg);
  -webkit-mask: radial-gradient(circle, transparent 0 21%, #000 24%, #000 46%, transparent 70%); mask: radial-gradient(circle, transparent 0 21%, #000 24%, #000 46%, transparent 70%);
  animation: ld-spin 5s linear infinite; }
.sp-disk.d2 { inset: 14%; opacity: .75; animation: ld-spin 8s linear infinite reverse;
  background: conic-gradient(from 90deg, rgba(251,191,36,0), rgba(251,191,36,.55) 60deg, rgba(236,72,153,0) 140deg, rgba(167,139,250,.7) 220deg, rgba(56,189,248,0) 300deg, rgba(251,191,36,0)); }
.sp-disk.d3 { inset: 0; opacity: .35; animation: ld-spin 14s linear infinite;
  -webkit-mask: radial-gradient(circle, transparent 0 34%, #000 40%, transparent 70%); mask: radial-gradient(circle, transparent 0 34%, #000 40%, transparent 70%); }
.sp-ring { left: 50%; top: 50%; width: 25vmin; height: 25vmin; margin: -12.5vmin 0 0 -12.5vmin; border-radius: 50%;
  box-shadow: 0 0 0 .35vmin rgba(224,231,255,.85), 0 0 3vmin .6vmin rgba(165,180,252,.75), inset 0 0 3vmin rgba(129,140,248,.6);
  animation: sp-ringp 2.4s ease-in-out infinite; }
@keyframes sp-ringp { 0%, 100% { transform: scale(1); opacity: .85; } 50% { transform: scale(1.04); opacity: 1; } }
.sp-core { left: 50%; top: 50%; width: 23vmin; height: 23vmin; margin: -11.5vmin 0 0 -11.5vmin; border-radius: 50%;
  background: radial-gradient(circle, #000 0 58%, #05030f 70%, rgba(30,20,70,.9) 100%); }
/* ánh sáng bị bẻ cong vắt qua đỉnh lỗ (kiểu "Interstellar") */
.sp-arc { left: 50%; top: 50%; width: 46vmin; height: 34vmin; margin: -19vmin 0 0 -23vmin; border-radius: 50%;
  border: .55vmin solid transparent; border-top-color: rgba(255,228,196,.95); border-left-color: rgba(253,186,116,.35); border-right-color: rgba(253,186,116,.35);
  box-shadow: 0 -1.2vmin 3vmin -1vmin rgba(251,191,36,.55); animation: sp-ringp 2.4s ease-in-out infinite; animation-delay: -1.2s; }
.sp-band { left: 50%; top: 50%; width: 70vmin; height: 2.6vmin; margin: -1.3vmin 0 0 -35vmin; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(255,236,210,.95) 0%, rgba(251,191,36,.55) 30%, rgba(236,72,153,.25) 60%, transparent 72%); animation: sp-pulse 3.2s ease-in-out infinite; }
/* phi thuyền lao vào lỗ */
.sp-fly { left: 50%; top: 38%; width: 0; height: 0; }
.sp-ship { left: -7vmin; top: -2.9vmin; width: 14vmin; height: 5.8vmin; }
.sp-ship .tr { position: absolute; right: 80%; top: 36%; width: 34vmin; height: 28%; border-radius: 99px;
  background: linear-gradient(270deg, #fff, rgba(125,211,252,.85) 12%, rgba(56,189,248,.35) 40%, rgba(99,102,241,0)); }
.f1 { animation: sp-in1 3.4s cubic-bezier(.55,0,.9,.6) infinite; animation-delay: -1.2s; }
.f2 { animation: sp-in2 4.2s cubic-bezier(.55,0,.9,.6) infinite; animation-delay: -3.1s; }
.f3 { animation: sp-in3 3.8s cubic-bezier(.55,0,.9,.6) infinite; animation-delay: -.4s; }
@keyframes sp-in1 { 0% { transform: translate(-62vw, 30vh) rotate(-22deg) scale(1.35); opacity: 0; } 10% { opacity: 1; } 82% { opacity: 1; }
  100% { transform: translate(-1vw, 1vh) rotate(-8deg) scale(.03); opacity: 0; } }
@keyframes sp-in2 { 0% { transform: translate(60vw, -34vh) rotate(-30deg) scale(-1.1, 1.1); opacity: 0; } 10% { opacity: 1; } 82% { opacity: 1; }
  100% { transform: translate(1vw, -1vh) rotate(-12deg) scale(-.03, .03); opacity: 0; } }
@keyframes sp-in3 { 0% { transform: translate(56vw, 36vh) rotate(26deg) scale(-1.5, 1.5); opacity: 0; } 10% { opacity: 1; } 82% { opacity: 1; }
  100% { transform: translate(1vw, 1vh) rotate(10deg) scale(-.03, .03); opacity: 0; } }
/* hành tinh */
.sp-p1 { left: -16vmin; bottom: -24vmin; width: 60vmin; height: 60vmin; animation: sp-float 9s ease-in-out infinite; }
.sp-p2 { right: 7vmin; top: 7vmin; width: 15vmin; height: 15vmin; animation: sp-float 7s ease-in-out infinite reverse; }
@keyframes sp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.4vmin); } }
.sp-cruiser { left: 0; top: 13%; width: 30vmin; height: 7vmin; opacity: .5; animation: sp-cruise 34s linear infinite; animation-delay: -12s; }
@keyframes sp-cruise { 0% { transform: translateX(-35vmin); } 100% { transform: translateX(110vw); } }
.sp-comet { left: 0; top: 0; width: 22vmin; height: 2px; border-radius: 2px; background: linear-gradient(90deg, transparent, #e0f2fe);
  opacity: 0; animation: sp-comet 6s ease-in infinite; animation-delay: 1.4s; }
@keyframes sp-comet { 0% { transform: translate(62vw, 8vh) rotate(155deg); opacity: 0; } 4% { opacity: 1; } 14% { transform: translate(30vw, 26vh) rotate(155deg); opacity: 0; } 100% { opacity: 0; transform: translate(30vw, 26vh) rotate(155deg); } }

/* ===================== WEST — TRAIN RUSH ===================== */
.aw-ld3d.is-west { place-items: start center;
  background: linear-gradient(180deg, #1d1440 0%, #4b2766 20%, #a3416a 40%, #e8683a 56%, #ffae52 66%, #ffd88e 71%, #ffe7b0 72.5%, #6a3420 72.6%, #3a1c10 80%, #1c0e07 100%);
  --ld-tt: linear-gradient(180deg, #fff3cf 0%, #ffd27a 45%, #e08a2a 75%, #9a4f14 100%); --ld-glow: rgba(255,170,70,.55);
  --ld-track: rgba(60,30,15,.45); --ld-bar: linear-gradient(90deg, #f0b24a, #ffe6a3); --ld-sub: #ffe9c2; --ld-studio: #fff1d6; }
.aw-ld3d.is-west .aw-ld3d-in { margin-top: 9vh; }
.aw-ld3d.is-west .aw-ld3d-t { font-family: Rye, "Baloo 2", serif; font-weight: 400; letter-spacing: .04em; filter: drop-shadow(0 .5vmin 0 #5a2a0c) drop-shadow(0 0 2.4vmin rgba(255,150,60,.5)); }
.aw-ld3d.is-west .aw-ld3d-s { text-shadow: 0 1px 2px rgba(90,40,10,.6); }
.aw-ld3d.is-west .aw-ld3d-studio { text-shadow: 0 1px 2px rgba(90,40,10,.55); }
.w-sun { left: 66%; top: 100%; width: 30vmin; height: 30vmin; margin: -15vmin 0 0 -15vmin; border-radius: 50%;
  background: radial-gradient(circle, #fffbe8 0%, #fff0b8 35%, #ffd06a 60%, #ff9a3c 76%, rgba(255,140,60,0) 78%);
  box-shadow: 0 0 10vmin 4vmin rgba(255,170,80,.55), 0 0 30vmin 12vmin rgba(255,120,60,.3); animation: w-sun 4s ease-in-out infinite; }
@keyframes w-sun { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.025); } }
.w-rays { left: 66%; top: 100%; width: 150vmax; height: 150vmax; margin: -75vmax 0 0 -75vmax; border-radius: 50%; opacity: .55;
  background: repeating-conic-gradient(from 0deg, rgba(255,226,160,.22) 0deg 4deg, rgba(255,226,160,0) 4deg 15deg);
  -webkit-mask: radial-gradient(circle, #000 4%, transparent 42%); mask: radial-gradient(circle, #000 4%, transparent 42%);
  animation: ld-spin 80s linear infinite; }
.w-hclip { left: 0; right: 0; top: 0; height: 72.5%; overflow: hidden; }
.w-cloud { height: 3.4vmin; border-radius: 50%; background: radial-gradient(ellipse at 50% 60%, rgba(255,214,196,.75) 0%, rgba(255,180,160,.45) 40%, rgba(255,170,150,0) 70%); }
.w-c1 { left: 6%; top: 32%; width: 40vmin; animation: w-cloud 40s linear infinite; }
.w-c2 { left: 52%; top: 40%; width: 55vmin; height: 2vmin; opacity: .8; animation: w-cloud 55s linear infinite; animation-delay: -20s; }
.w-c3 { left: 20%; top: 47%; width: 34vmin; height: 1.6vmin; opacity: .7; animation: w-cloud 48s linear infinite; animation-delay: -8s; }
@keyframes w-cloud { 0% { transform: translateX(-12vw); } 100% { transform: translateX(12vw); } }
.w-mesa { left: 0; right: 0; bottom: 27.5%; height: 15vmin; }
.w-mesa.m2 { height: 10vmin; }
/* chim: đàn bay ngang trời, từng con lượn lên xuống lệch nhịp (đuổi nhau), cánh vỗ */
.w-flock { left: 0; top: 40%; width: 0; height: 0; animation: w-flock 12s linear infinite; animation-delay: -4s; }
.w-flock.f2 { top: 52%; animation-duration: 16s; animation-delay: -9s; }
@keyframes w-flock { 0% { transform: translateX(108vw); } 100% { transform: translateX(-24vw); } }
.w-bwrap { left: var(--x); top: var(--y); animation: w-weave var(--d, 1.8s) ease-in-out infinite alternate; animation-delay: var(--dl, 0s); will-change: transform; }
@keyframes w-weave { 0% { transform: translate(0, -1.6vmin); } 100% { transform: translate(-2.4vmin, 1.8vmin); } }
.w-bird { position: relative; width: calc(6.4vmin * var(--s, 1)); height: calc(2.8vmin * var(--s, 1)); }
.w-bird b { position: absolute; top: 40%; width: 50%; height: 60%; will-change: transform;
  background: #2a1324; clip-path: polygon(0 40%, 50% 10%, 100% 70%, 100% 100%, 45% 45%, 0 60%); animation: w-flap .42s ease-in-out infinite alternate; }
.w-bird b:first-child { left: 0; transform-origin: 100% 85%; }
.w-bird b:last-child { right: 0; transform-origin: 0 85%; transform: scaleX(-1); animation-name: w-flap2; }
@keyframes w-flap { 0% { transform: rotate(-26deg); } 100% { transform: rotate(22deg); } }
@keyframes w-flap2 { 0% { transform: scaleX(-1) rotate(-26deg); } 100% { transform: scaleX(-1) rotate(22deg); } }
.w-bird i { position: absolute; left: 44%; top: 62%; width: 12%; height: 22%; border-radius: 50%; background: #2a1324; }
/* đường ray + vật trôi lùi */
.w-rail { left: 0; right: 0; height: .5vmin; background: linear-gradient(180deg, #e8b778, #6b3a1c); box-shadow: 0 .35vmin .4vmin rgba(0,0,0,.45); }
.w-ties { left: 0; width: calc(100% + 40px); height: 1.3vmin;
  background: repeating-linear-gradient(90deg, #1a0d07 0 10px, rgba(0,0,0,0) 10px 40px); animation: w-ties .14s linear infinite; }
.w-ties.t2 { animation-duration: .17s; height: 1vmin; }
@keyframes w-ties { to { transform: translateX(-40px); } }
.w-pass { left: 0; bottom: 16%; width: 200%; height: 11vmin; display: flex; animation: w-pass 6s linear infinite; }
.w-pass > svg { flex: 0 0 50%; }
@keyframes w-pass { to { transform: translateX(-50%); } }
/* đoàn tàu: thay nhau dẫn, nảy nhẹ; bánh quay; khói phụt */
.w-train { width: 50vmin; aspect-ratio: 400 / 120; }
.w-tA { left: 30vw; bottom: calc(23.1% - 1.1vmin); opacity: .92; animation: w-leadA 5.6s ease-in-out infinite; }
.w-tB { left: 22vw; bottom: calc(2.6% - 1.8vmin); width: 80vmin; animation: w-leadB 5.6s ease-in-out infinite; }
@keyframes w-leadA { 0%, 100% { transform: translateX(-6vw); } 50% { transform: translateX(16vw); } }
@keyframes w-leadB { 0%, 100% { transform: translateX(12vw); } 50% { transform: translateX(-8vw); } }
.w-body { position: absolute; inset: 0; animation: w-bob .23s ease-in-out infinite alternate; will-change: transform; }
@keyframes w-bob { 0% { transform: translateY(0); } 100% { transform: translateY(-.25vmin); } }
.w-wh { position: absolute; will-change: transform; animation: ld-spin .32s linear infinite; }
.w-puff { position: absolute; left: 89%; top: 4%; width: 26%; aspect-ratio: 1; margin: -13% 0 0 -13%; border-radius: 50%; opacity: 0; will-change: transform, opacity;
  background: radial-gradient(circle, rgba(255,240,224,.95) 0%, rgba(230,196,178,.7) 40%, rgba(214,170,150,0) 70%); animation: w-puff 1.1s ease-out infinite; }
.w-puff.p2 { animation-delay: -.37s; } .w-puff.p3 { animation-delay: -.74s; }
@keyframes w-puff { 0% { transform: translate(0, 0) scale(.25); opacity: 1; } 100% { transform: translate(-160%, -70%) scale(1.8); opacity: 0; } }
.w-dust { left: 0; right: 0; bottom: 0; height: 9%; background: linear-gradient(180deg, rgba(20,10,6,0), rgba(20,10,6,.75)); }
`;

// ---------------------------------------------------------------- hình vẽ (SVG)
// phi thuyền nhìn ngang, mũi bên phải (viewBox 120×50)
const SHIP = `<svg viewBox="0 0 120 50"><defs><linearGradient id="ldShH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset=".55" stop-color="#94a3b8"/><stop offset="1" stop-color="#334155"/></linearGradient>
<radialGradient id="ldShE"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#7dd3fc"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></radialGradient></defs>
<path d="M30 14 L62 3 L70 14 Z" fill="#475569"/><path d="M30 36 L62 47 L70 36 Z" fill="#334155"/>
<path d="M14 18 L84 14 Q112 20 118 25 Q112 30 84 36 L14 32 Q8 25 14 18 Z" fill="url(#ldShH)"/>
<path d="M78 18 Q96 20 104 25 L78 26 Z" fill="#0ea5e9" opacity=".85"/><path d="M80 19 Q92 21 98 24 L80 24 Z" fill="#e0f2fe" opacity=".7"/>
<rect x="24" y="23.5" width="56" height="2.6" rx="1.3" fill="#a78bfa"/><circle cx="12" cy="25" r="9" fill="url(#ldShE)"/></svg>`;
// tàu mẹ xa (hình nêm)
const CRUISER = `<svg viewBox="0 0 300 70"><path d="M0 40 L240 8 L300 34 L240 62 Z" fill="#1e1b4b"/><path d="M0 40 L240 8 L300 34 Z" fill="#312e81"/>
<rect x="150" y="16" width="40" height="10" fill="#3730a3"/><rect x="170" y="8" width="16" height="10" fill="#4338ca"/><circle cx="4" cy="40" r="4" fill="#7dd3fc"/></svg>`;
// hành tinh vành đai (vành sau · thân · vành trước)
const PLANET1 = `<svg viewBox="0 0 200 200"><defs>
<linearGradient id="ldP1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c084fc"/><stop offset=".3" stop-color="#7c3aed"/><stop offset=".55" stop-color="#f59e0b"/><stop offset=".7" stop-color="#9333ea"/><stop offset="1" stop-color="#3b0764"/></linearGradient>
<radialGradient id="ldP1s" cx=".3" cy=".28" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
<clipPath id="ldP1f"><rect x="0" y="100" width="200" height="100"/></clipPath></defs>
<ellipse cx="100" cy="100" rx="96" ry="22" fill="none" stroke="#fde68a" stroke-opacity=".35" stroke-width="4" transform="rotate(-16 100 100)"/><ellipse cx="100" cy="100" rx="86" ry="19" fill="none" stroke="#f9a8d4" stroke-opacity=".25" stroke-width="2.5" transform="rotate(-16 100 100)"/>
<circle cx="100" cy="100" r="58" fill="url(#ldP1)"/><circle cx="100" cy="100" r="58" fill="url(#ldP1s)"/>
<g clip-path="url(#ldP1f)" transform="rotate(-16 100 100)"><ellipse cx="100" cy="100" rx="96" ry="22" fill="none" stroke="#fde68a" stroke-opacity=".8" stroke-width="4"/>
<ellipse cx="100" cy="100" rx="84" ry="18" fill="none" stroke="#f9a8d4" stroke-opacity=".5" stroke-width="3"/></g></svg>`;
const PLANET2 = `<svg viewBox="0 0 100 100"><defs><radialGradient id="ldP2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#bae6fd"/><stop offset=".45" stop-color="#0284c7"/><stop offset="1" stop-color="#0c1a3a"/></radialGradient></defs>
<circle cx="50" cy="50" r="49" fill="#38bdf8" opacity=".18"/><circle cx="50" cy="50" r="40" fill="url(#ldP2)"/>
<path d="M14 44 Q40 36 86 48" stroke="#e0f2fe" stroke-opacity=".35" stroke-width="4" fill="none"/><path d="M18 60 Q50 54 84 62" stroke="#e0f2fe" stroke-opacity=".22" stroke-width="3" fill="none"/></svg>`;
// núi mesa miền Tây (2 lớp, viewBox 1000×100, kéo giãn ngang)
const MESA_FAR = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="M0 100 L0 70 L60 70 L70 40 L170 40 L182 70 L300 72 L312 52 L360 52 L372 74 L520 74 L534 30 L660 30 L672 64 L760 66 L772 46 L830 46 L842 70 L1000 70 L1000 100 Z" fill="#7a3554" opacity=".75"/></svg>`;
const MESA_NEAR = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="M0 100 L0 60 L120 62 L132 26 L250 26 L262 64 L420 66 L640 66 L652 40 L700 40 L712 68 L880 64 L892 20 L960 20 L972 60 L1000 60 L1000 100 Z" fill="#4a1d2c"/></svg>`;
// xương rồng + cột điện trôi lùi (dải 2 bản giống nhau ⇒ vòng lặp liền)
const PASS_ONE = `<svg viewBox="0 0 1000 110" preserveAspectRatio="none"><g fill="#1f0e08">
<path d="M80 110 V40 Q80 30 90 30 Q100 30 100 40 V110 Z M70 70 Q60 70 60 58 V48 Q60 42 66 42 Q72 42 72 48 V60 H80 V70 Z M100 62 H108 V50 Q108 44 114 44 Q120 44 120 50 V60 Q120 72 108 72 H100 Z"/>
<rect x="330" y="20" width="4" height="90"/><rect x="314" y="26" width="36" height="3"/>
<path d="M560 110 V64 Q560 56 568 56 Q576 56 576 64 V110 Z M552 86 Q546 86 546 78 V72 Q546 68 550 68 Q554 68 554 72 V80 H560 V86 Z"/>
<rect x="760" y="20" width="4" height="90"/><rect x="744" y="26" width="36" height="3"/>
<path d="M900 110 Q890 96 908 92 Q904 82 916 84 Q926 76 932 90 Q946 92 940 110 Z"/></g></svg>`;
// đoàn tàu nhìn ngang, đầu máy bên phải (viewBox 400×120). Bánh xe là thẻ riêng (quay) — xem WHEELS.
function trainSvg(id, accent, accent2) {
  return `<svg viewBox="0 0 400 120"><defs><linearGradient id="ldTb${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2416"/><stop offset="1" stop-color="#140a05"/></linearGradient></defs>
<g stroke="#ffcf8a" stroke-opacity=".55" stroke-width="1.2">
<rect x="4" y="44" width="92" height="44" rx="3" fill="url(#ldTb${id})"/><rect x="2" y="40" width="96" height="6" rx="2" fill="#2a170c"/>
<rect x="108" y="44" width="92" height="44" rx="3" fill="url(#ldTb${id})"/><rect x="106" y="40" width="96" height="6" rx="2" fill="#2a170c"/>
<rect x="214" y="22" width="52" height="66" rx="3" fill="url(#ldTb${id})"/><rect x="208" y="16" width="64" height="8" rx="3" fill="#2a170c"/>
<rect x="262" y="46" width="112" height="38" rx="14" fill="url(#ldTb${id})"/>
<path d="M352 46 L350 20 L340 10 L376 10 L366 20 L364 46 Z" fill="#1d0f07"/>
<path d="M300 46 Q300 32 312 32 Q324 32 324 46 Z" fill="#2a170c"/>
<path d="M374 66 L398 96 L374 96 Z" fill="#2a170c"/></g>
<rect x="10" y="58" width="80" height="8" fill="${accent}"/><rect x="114" y="58" width="80" height="8" fill="${accent}"/>
<rect x="262" y="60" width="112" height="7" fill="${accent}"/><rect x="214" y="58" width="52" height="7" fill="${accent2}"/>
<rect x="224" y="30" width="32" height="20" rx="2" fill="#ffcf7a" opacity=".85"/>
<circle cx="380" cy="54" r="6" fill="#fff4c2"/><circle cx="380" cy="54" r="14" fill="#ffe28a" opacity=".25"/>
<rect x="0" y="88" width="376" height="5" fill="#120804"/><rect x="96" y="80" width="12" height="4" fill="#120804"/><rect x="200" y="80" width="14" height="4" fill="#120804"/></svg>`;
}
const WHEEL = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#1a0c05" stroke="#d9a35a" stroke-width="2.4"/>
<g stroke="#d9a35a" stroke-width="2"><path d="M20 4 V36 M4 20 H36 M8.7 8.7 L31.3 31.3 M31.3 8.7 L8.7 31.3"/></g><circle cx="20" cy="20" r="4.5" fill="#d9a35a"/></svg>`;
// [tâm x, tâm y, bán kính] theo viewBox 400×120 ⇒ % của khung tàu
const WHEELS = [[24, 98, 11], [76, 98, 11], [128, 98, 11], [180, 98, 11], [228, 100, 9], [288, 92, 18], [332, 92, 18], [368, 100, 9]];
function train(cls, id, accent, accent2) {
  const wh = WHEELS.map(([x, y, r]) => `<span class="w-wh" style="left:${(x - r) / 4}%;top:${(y - r) / 1.2}%;width:${r / 2}%;height:${r * 2 / 1.2}%">${WHEEL}</span>`).join("");
  return `<div class="l w-train ${cls}"><div class="w-body">${trainSvg(id, accent, accent2)}${wh}<i class="w-puff"></i><i class="w-puff p2"></i><i class="w-puff p3"></i></div></div>`;
}
// [x vmin, y vmin, cỡ, nhịp lượn s, lệch nhịp s]
function birds(list) {
  return list.map(([x, y, s, d, dl]) => `<div class="l w-bwrap" style="--x:${x}vmin;--y:${y}vmin;--d:${d}s;--dl:${dl}s"><div class="w-bird" style="--s:${s}"><b></b><b></b><i></i></div></div>`).join("");
}

const SCENE = {
  space: () => `<div class="l sp-neb a"></div><div class="l sp-stars s2 a"></div><div class="l sp-stars s1 a"></div>
<div class="l sp-cruiser a">${CRUISER}</div><div class="l sp-comet a"></div>
<div class="l sp-p2 a">${PLANET2}</div>
<div class="l sp-hole"><div class="l sp-glow a"></div><div class="l sp-tilt"><div class="l sp-disk d3 a"></div><div class="l sp-disk a"></div><div class="l sp-disk d2 a"></div></div>
<div class="l sp-band a"></div><div class="l sp-ring a"></div><div class="l sp-core"></div><div class="l sp-arc a"></div></div>
<div class="l sp-fly"><div class="l sp-ship f1 a"><i class="tr"></i>${SHIP}</div></div>
<div class="l sp-fly"><div class="l sp-ship f2 a"><i class="tr"></i>${SHIP}</div></div>
<div class="l sp-fly"><div class="l sp-ship f3 a"><i class="tr"></i>${SHIP}</div></div>
<div class="l sp-p1 a">${PLANET1}</div>`,
  west: () => `<div class="l w-hclip"><div class="l w-rays a"></div><div class="l w-sun a"></div></div>
<div class="l w-hclip"><div class="l w-cloud w-c1 a"></div><div class="l w-cloud w-c2 a"></div><div class="l w-cloud w-c3 a"></div>
<div class="l w-flock a">${birds([[0, 0, 1, 1.7, 0], [7, 3, .85, 1.5, -.6], [13, -2, .9, 1.9, -1.1], [20, 2, .75, 1.6, -.3]])}</div>
<div class="l w-flock f2 a">${birds([[0, 0, .7, 1.4, -.2], [6, 2, .6, 1.7, -.9], [10, -1.5, .65, 1.5, -.5]])}</div></div>
<div class="l w-mesa">${MESA_FAR}</div><div class="l w-mesa m2">${MESA_NEAR}</div>
<div class="l w-pass a">${PASS_ONE}${PASS_ONE}</div>
<div class="l w-rail" style="bottom:23.1%"></div><div class="l w-ties t2 a" style="bottom:22.4%"></div>
${train("w-tA", "a", "#c0392b", "#e74c3c")}
<div class="l w-rail" style="bottom:2.6%"></div><div class="l w-ties a" style="bottom:1.5%"></div>
${train("w-tB", "b", "#1f6fd1", "#3b8ff0")}
`
};

function ensureCss() {
  if (document.getElementById("aw-ld3d-css")) return;
  const st = document.createElement("style");
  st.id = "aw-ld3d-css";
  st.textContent = CSS;
  document.head.append(st);
}

// Đợt 452 — gọi SỚM (lúc nạp module template) để phông của màn chờ đã sẵn khi màn chờ hiện: ngay sau khi hiện, luồng chính bận
// dựng cảnh 3D ~2 s nên chữ tên game không đổi lớp kịp (đo 03/10: máy chưa lưu phông ⇒ tên TRAIN RUSH trống ~2,4 s).
export function preloadLoader3d(theme) {
  try { ensureCss(); document.fonts.load(theme === "west" ? '400 60px Rye' : '800 60px "Baloo 2"').catch(() => {}); } catch (e) { /* màn chờ tự lo */ }
}

export function showLoader3d({ key, title, theme = "space" }) {
  const cur = live.get(key);
  if (cur && !cur.gone) return cur;
  ensureCss();
  const el = document.createElement("div");
  el.className = "aw-ld3d is-" + theme;
  el.setAttribute("role", "status");
  el.setAttribute("aria-label", "Loading " + title);
  el.innerHTML = (SCENE[theme] ? SCENE[theme]() : "") +
    `<div class="aw-ld3d-in"><div class="aw-ld3d-studio"><i></i>ANDREW STUDIO<i></i></div><div class="aw-ld3d-t"></div><div class="aw-ld3d-bar"><i></i></div><div class="aw-ld3d-s">LOADING</div></div>`;
  el.querySelector(".aw-ld3d-t").textContent = title;
  document.body.append(el);
  // phông của game (Baloo 2 800 có sẵn trong AWord · Rye nạp từ Google Fonts) — chờ tối đa 1,2 s rồi hiện dù chưa có
  const font = theme === "west" ? '400 60px Rye' : '800 60px "Baloo 2"';
  // `ready` (Đợt 452): chữ tên game đã hiện VÀ đã vẽ lên màn (2 nhịp vẽ) — template chờ cái này rồi mới bắt đầu dựng cảnh 3D
  // (dựng cảnh khoá luồng chính ~2 s: đổi lớp lúc đó là trễ). Tối đa 0,9 s — mạng chậm thì thôi, dựng game trước.
  let markShown = () => {};
  const shownP = new Promise(r => { markShown = r; });
  const showT = () => { el.classList.add("is-font"); requestAnimationFrame(() => requestAnimationFrame(() => markShown())); };
  // ⚠️ trang AWord thật (index.html / play.html) preload Baloo 800 ⇒ check() đúng ngay ⇒ chữ hiện từ KHUNG ĐẦU. Phải hiện đồng bộ:
  // ngay sau đây luồng chính bận dựng cảnh 3D 1–2 s, mọi promise/hẹn giờ đều phải xếp hàng chờ.
  // ⚠️ Đợt 452 — Rye (TRAIN RUSH) nạp từ Google Fonts: lúc màn chờ hiện, file CSS của phông có khi CHƯA về ⇒ trình duyệt chưa biết
  // phông tên Rye ⇒ fonts.check() trả TRUE (không có gì phải nạp) ⇒ chữ hiện bằng phông tạm ~2 s (đo 03/10). Phải thấy đúng mặt
  // phông Rye đã nạp xong mới hiện; dò lại mỗi 120 ms, tối đa 3 s rồi hiện dù chưa có.
  const famOk = () => theme !== "west" || [...document.fonts].some(f => /Rye/i.test(f.family) && f.status === "loaded");
  let has = false; try { has = famOk() && document.fonts.check(font); } catch (e) { has = true; }
  if (has) showT();
  else if (theme === "west") {
    try { document.fonts.load(font).catch(() => {}); } catch (e) { /* tick() lo */ }
    const t0 = performance.now();
    const tick = () => {
      if (!el.isConnected) return;
      let ok = false; try { ok = famOk(); } catch (e) { ok = true; }
      if (ok || performance.now() - t0 > 3000) { showT(); return; }
      try { const face = [...document.fonts].find(f => /Rye/i.test(f.family)); if (face && face.status === "unloaded") face.load().catch(() => {}); } catch (e) { /* thử lại nhịp sau */ }
      setTimeout(tick, 120);
    };
    tick();
  }
  else { try { Promise.race([document.fonts.load(font), new Promise(r => setTimeout(r, 1200))]).then(showT, showT); } catch (e) { showT(); } }
  const h = {
    gone: false,
    ready: Promise.race([shownP, new Promise(r => setTimeout(r, 900))]),
    // game đã vẽ xong khung đầu ⇒ mờ đi (đợi 2 nhịp vẽ để khung game thật đã lên màn trước khi lộ ra)
    done() {
      if (h.gone) return; h.gone = true;
      if (live.get(key) === h) live.delete(key);
      clearTimeout(safety);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.add("is-out");
        setTimeout(() => el.remove(), 550);
      }));
    },
    // gỡ ngay (rời game trước khi nạp xong)
    drop() {
      if (h.gone) return; h.gone = true;
      if (live.get(key) === h) live.delete(key);
      clearTimeout(safety); el.remove();
    }
  };
  const safety = setTimeout(() => h.done(), 25000);
  live.set(key, h);
  return h;
}
