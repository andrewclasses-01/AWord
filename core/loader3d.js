// =============================================================
// core/loader3d.js — MÀN CHỜ cho game 3D tự vẽ trọn màn (Đợt 451, thầy 03/10/2026: "khi khởi động game STAR LOOT
// có hình này một lát khá xấu… tạo một màn loading").
// Đo thật (cửa sổ offscreen, bộ đệm trống): STAR LOOT ~2,25 s thấy KHUNG TRẮNG trống của AWord (đồng hồ 0:00, ô điểm,
// nút ‹ ›) trong lúc nạp three.js + dựng cảnh; TRAIN RUSH ~2 s màn tối trơn.
// Cách chữa: lớp phủ trọn trang hiện NGAY từ `tpl.startScreen` (engine gọi đồng bộ lúc dựng màn READY ⇒ khung đầu tiên
// đã là màn chờ), giữ qua mount, tự mờ đi khi game báo xong (`done()`). Một màn chờ cho mỗi `key` — gọi show() lần
// nữa (startScreen rồi mount) chỉ trả lại đúng màn đang hiện.
//   const ld = showLoader3d({ key: "starloot", title: "STAR LOOT", theme: "space" | "west" });  …  ld.done();
// ⚠️ z-index 1001: TRÊN ô game (.aw-sl-host / .aw-tr-host = 1000) — game dựng xong dưới màn chờ rồi mới lộ ra.
// ⚠️ Lưới an toàn: tự mờ sau 25 s dù không ai gọi done() (game lỗi giữa chừng không được kẹt màn chờ mãi).
// =============================================================

const live = new Map();   // key → handle

const CSS = `
.aw-ld3d { position: fixed; inset: 0; z-index: 1001; display: grid; place-items: center; overflow: hidden;
  transition: opacity .45s ease; font-family: "Baloo 2", system-ui, sans-serif; user-select: none; -webkit-user-select: none; }
.aw-ld3d.is-out { opacity: 0; pointer-events: none; }
.aw-ld3d-in { display: flex; flex-direction: column; align-items: center; gap: 2.2vmin; transform: translateY(-2vmin); }
.aw-ld3d-t { font-weight: 800; font-size: clamp(34px, 9vmin, 120px); letter-spacing: .06em; line-height: 1; text-align: center;
  background: var(--ld-tt); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 2.2vmin var(--ld-glow)); opacity: 0; transition: opacity .35s ease; }
/* chữ chỉ hiện khi phông của game đã nạp (không nhảy từ phông tạm sang Baloo/Rye giữa chừng) */
.aw-ld3d.is-font .aw-ld3d-t { opacity: 1; }
.aw-ld3d-bar { position: relative; width: clamp(180px, 34vmin, 420px); height: 5px; border-radius: 99px; overflow: hidden; background: var(--ld-track); }
/* ⚠️ chạy bằng TRANSFORM (luồng vẽ riêng của trình duyệt) — lúc dựng cảnh 3D luồng chính bận cứng 1–2 s, animation \`left\` đứng hình */
.aw-ld3d-bar i { position: absolute; top: 0; bottom: 0; left: 0; width: 38%; border-radius: inherit; background: var(--ld-bar);
  box-shadow: 0 0 12px var(--ld-glow); will-change: transform; animation: aw-ld3d-run 1.25s cubic-bezier(.45,.05,.55,.95) infinite; }
.aw-ld3d-s { font-weight: 700; font-size: clamp(11px, 1.6vmin, 18px); letter-spacing: .5em; padding-left: .5em; color: var(--ld-sub); }
@keyframes aw-ld3d-run { 0% { transform: translateX(-105%); } 100% { transform: translateX(268%); } }
/* vũ trụ (STAR LOOT): tím than + sao lấm tấm */
.aw-ld3d.is-space { background:
  radial-gradient(1.5px 1.5px at 12% 18%, #fff8, transparent 60%), radial-gradient(1px 1px at 78% 22%, #fff9, transparent 60%),
  radial-gradient(1.5px 1.5px at 64% 74%, #fff7, transparent 60%), radial-gradient(1px 1px at 30% 82%, #fff8, transparent 60%),
  radial-gradient(1px 1px at 88% 58%, #fff6, transparent 60%), radial-gradient(1.5px 1.5px at 46% 36%, #fff5, transparent 60%),
  radial-gradient(ellipse at 30% 25%, #3b1466 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, #1e2a6e 0%, transparent 55%), #07060f;
  --ld-tt: linear-gradient(180deg, #ffffff 0%, #c7d2fe 55%, #7c83ff 100%); --ld-glow: rgba(125,140,255,.55);
  --ld-track: rgba(125,211,252,.16); --ld-bar: linear-gradient(90deg, #38bdf8, #a78bfa); --ld-sub: #93c5fd; }
/* miền Tây (TRAIN RUSH): nâu gỗ + chữ vàng đồng kiểu Rye */
.aw-ld3d.is-west { background: radial-gradient(ellipse at 50% 35%, #5a3518 0%, #2c1a0d 55%, #120c07 100%);
  --ld-tt: linear-gradient(180deg, #ffe7a8 0%, #f0b24a 55%, #a8641e 100%); --ld-glow: rgba(255,190,90,.35);
  --ld-track: rgba(200,154,74,.22); --ld-bar: linear-gradient(90deg, #c89a4a, #ffd98a); --ld-sub: #e8cf9c; }
.aw-ld3d.is-west .aw-ld3d-t { font-family: Rye, "Baloo 2", serif; font-weight: 400; letter-spacing: .04em; }
`;

function ensureCss() {
  if (document.getElementById("aw-ld3d-css")) return;
  const st = document.createElement("style");
  st.id = "aw-ld3d-css";
  st.textContent = CSS;
  document.head.append(st);
}

export function showLoader3d({ key, title, theme = "space" }) {
  const cur = live.get(key);
  if (cur && !cur.gone) return cur;
  ensureCss();
  const el = document.createElement("div");
  el.className = "aw-ld3d is-" + theme;
  el.setAttribute("role", "status");
  el.setAttribute("aria-label", "Loading " + title);
  el.innerHTML = `<div class="aw-ld3d-in"><div class="aw-ld3d-t"></div><div class="aw-ld3d-bar"><i></i></div><div class="aw-ld3d-s">LOADING</div></div>`;
  el.querySelector(".aw-ld3d-t").textContent = title;
  document.body.append(el);
  // phông của game (Baloo 2 800 có sẵn trong AWord · Rye nạp từ Google Fonts) — chờ tối đa 1,2 s rồi hiện dù chưa có
  const font = theme === "west" ? '400 60px Rye' : '800 60px "Baloo 2"';
  const showT = () => el.classList.add("is-font");
  // ⚠️ trang AWord thật (index.html / play.html) preload Baloo 800 ⇒ check() đúng ngay ⇒ chữ hiện từ KHUNG ĐẦU. Phải hiện đồng bộ:
  // ngay sau đây luồng chính bận dựng cảnh 3D 1–2 s, mọi promise/hẹn giờ đều phải xếp hàng chờ.
  let has = false; try { has = document.fonts.check(font); } catch (e) { has = true; }
  if (has) showT();
  else { try { Promise.race([document.fonts.load(font), new Promise(r => setTimeout(r, 1200))]).then(showT, showT); } catch (e) { showT(); } }
  const h = {
    gone: false,
    // game đã vẽ xong khung đầu ⇒ mờ đi (đợi 2 nhịp vẽ để khung game thật đã lên màn trước khi lộ ra)
    done() {
      if (h.gone) return; h.gone = true;
      if (live.get(key) === h) live.delete(key);
      clearTimeout(safety);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.add("is-out");
        setTimeout(() => el.remove(), 500);
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
