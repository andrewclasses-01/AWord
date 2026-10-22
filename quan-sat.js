// =============================================================
// quan-sat.js — ⭐⭐ Đợt 496 (thầy chốt 10/10/2026): THẦY QUAN SÁT TRỰC TIẾP
//
// Hai việc, đều CHỈ ở trang học sinh (play.html) — không đụng core/, không template nào phải biết:
//
//  1. VIÊN "Thầy Andrew đang quan sát trực tiếp" (`ngheQuanSat`) — thầy bấm XEM ở dashboard myLesson ⇒
//     kho `quanSat/{ma}` có cờ ⇒ trang mẹ bai.html báo vào khung này {type:'AWORD:QUAN_SAT', code, dang}.
//     Viên nằm TRONG khung game (`.aw-stage-inner`), giữa thanh trên, thẳng hàng chữ đồng hồ; bật ⇒ CUỘN
//     MƯỢT từ mép trên khung game xuống, tắt ⇒ cuộn ngược lên (`.aw-stage` overflow:hidden cắt phần ngoài
//     khung). Thiết kế đã chốt: `D:\OTHERS\CLAUDE\myLesson - thiet ke thay dang quan sat\THIET KE CHOT.md`
//     (nền trắng · "Andrew" xanh ngọc #0E7C6E · ảnh thầy 24px · 2 vòng sóng ĐỎ · không LIVE · không logo).
//     Đang bị quan sát ⇒ play.js gửi trạng thái ván lên máy chủ NGAY sau mỗi câu (≤ 1 s thay vì 15 s).
//
//  2. CHẾ ĐỘ XEM (`xemVan`, `play.html?g=<code>&xem=1`) — khung xem trong dashboard của thầy. Dựng lại
//     ĐÚNG ván em đang làm từ trạng thái `tplJ` (lamTiep/{ma}/bai/{code}, dashboard nghe onSnapshot rồi
//     chuyển vào bằng {type:'AWORD:XEM_TT', tt}) bằng chính đường LÀM TIẾP (Đợt 469: `ui.khoiPhuc`).
//     ⛔ KHÔNG GHI GÌ: không flushOutbox, không vé, không playLog/practiceLog, không lamTiep, không
//     localStorage lượt giữ, không chiếm trang (Đợt 490), không nộp điểm (submit giả). Không bấm/gõ được
//     (tấm chắn), không phát tiếng. Mỗi trạng thái mới ⇒ dựng lại ván (startGame với hwPreset, ẩn READY).
//
// Tin nhắn chỉ NHẬN từ các trang myLesson được tin (`VE_NGUON`, cùng danh sách của vé đăng nhập).
// =============================================================
import { startGame } from "./core/engine.js";
import { sound } from "./core/sound.js";
import { VE_NGUON } from "./core/assignments.js";

const ANH_THAY = new URL("./core/assets/thay-quan-sat.jpg", import.meta.url).href;

const CSS = `
.aw-qs{position:absolute;left:50%;top:var(--qs-top,10px);z-index:60;display:flex;align-items:center;gap:7px;height:30px;
  padding:0 13px 0 3px;border-radius:999px;background:#fff;color:#334155;white-space:nowrap;pointer-events:none;
  font-family:"Baloo 2","Segoe UI",system-ui,sans-serif;box-shadow:0 2px 10px rgba(15,23,42,.12),inset 0 0 0 1px #E2E8F0;
  transform-origin:50% 0;transform:translate(-50%,var(--qs-ra,-80px)) scale(var(--qs-k,1));transition:transform .65s cubic-bezier(.22,1,.36,1);will-change:transform}
.aw-qs.is-mo{transform:translate(-50%,0) scale(var(--qs-k,1))}
.aw-qs-av{position:relative;flex:none;width:24px;height:24px;border-radius:50%}
.aw-qs-av img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;border:1.5px solid #fff;box-sizing:border-box}
.aw-qs-av::before,.aw-qs-av::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid #FF4D57;
  animation:awQsSong 2.2s ease-out infinite}
.aw-qs-av::after{animation-delay:1.1s}
@keyframes awQsSong{0%{transform:scale(.95);opacity:.9}100%{transform:scale(1.45);opacity:0}}
.aw-qs b{font-size:13.5px;font-weight:700;line-height:1}
.aw-qs b em{font-style:normal;font-weight:800;color:#0E7C6E}
@media (prefers-reduced-motion:reduce){.aw-qs{transition:none}.aw-qs-av::before,.aw-qs-av::after{animation:none}}
html.aw-xem .aw-play-overlay{visibility:hidden}
`;
function napCss() {
  if (document.getElementById("awQsCss")) return;
  const s = document.createElement("style");
  s.id = "awQsCss"; s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------------- 1. VIÊN "THẦY ĐANG QUAN SÁT" ----------------
function taoVien() {
  napCss();
  const v = document.createElement("div");
  v.className = "aw-qs";
  v.setAttribute("aria-live", "polite");
  v.innerHTML = '<span class="aw-qs-av"><img alt="" src="' + ANH_THAY + '"></span><b>Thầy <em>Andrew</em> đang quan sát trực tiếp</b>';
  let dang = false, hen = null;
  // Đặt viên vào khung game HIỆN TẠI (ván mới / Start again dựng lại `.aw-stage-inner` ⇒ gắn lại) và canh giữa
  // theo chữ đồng hồ. ⚠️ Tâm chữ Baloo nằm THẤP hơn tâm hộp đồng hồ ~3px (đo mẫu v3) ⇒ +3.
  function dat() {
    const inner = document.querySelector(".aw-stage-inner");
    if (!inner) return false;
    if (v.parentNode !== inner) {
      v.classList.remove("is-mo");   // vào khung mới: đứng ngoài mép trên rồi mới cuộn xuống
      inner.appendChild(v);
      void v.offsetWidth;
    }
    // Cỡ viên THEO CỠ KHUNG GAME: thanh trên cao 34px ở khung ~980px (mẫu đã chốt) ⇒ hệ số k = cao thanh / 34, rồi co thêm
    // nếu khoảng giữa đồng hồ và ô điểm hẹp hơn viên. Phóng bằng scale (điểm neo mép trên-giữa) ⇒ mọi thứ co đều.
    const ir = inner.getBoundingClientRect();
    const moc = inner.querySelector(".aw-top-timer") || inner.querySelector(".aw-topbar");
    const tb = inner.querySelector(".aw-topbar");
    let k = tb && tb.getBoundingClientRect().height ? tb.getBoundingClientRect().height / 34 : 1;
    const t = inner.querySelector(".aw-top-timer"), d = inner.querySelector(".aw-top-right");
    if (t && d) {
      const cho = d.getBoundingClientRect().left - t.getBoundingClientRect().right - 12;
      const rong = v.offsetWidth;   // offsetWidth = bề rộng CHƯA scale
      if (cho > 0 && rong * k > cho) k = cho / rong;
    }
    k = Math.max(0.55, Math.min(1.3, k));
    let top = 10;
    if (moc) { const r = moc.getBoundingClientRect(); if (r.height) top = Math.round(r.top - ir.top + r.height / 2 + 3 * k - 15 * k); }
    top = Math.max(3, top);
    v.style.setProperty("--qs-k", k.toFixed(3));
    v.style.setProperty("--qs-top", top + "px");
    v.style.setProperty("--qs-ra", -(top + 32 * k + 8) + "px");   // hẳn ra ngoài mép trên khung game
    hinh = { inner, top, k };
    return true;
  }
  let hinh = null;
  return {
    hinh: () => (dang && v.parentNode && hinh && hinh.inner === v.parentNode ? hinh : null),   // Đợt 573 — chỗ đặt bong bóng tin thầy
    anh: () => v.querySelector(".aw-qs-av"),
    bat(on) {
      dang = !!on;
      clearInterval(hen); hen = null;
      if (dang) {
        if (dat()) requestAnimationFrame(() => requestAnimationFrame(() => { if (dang) v.classList.add("is-mo"); }));
        // gắn lại / canh lại mỗi 0,5 s khi còn bật (ván mới, xoay màn, phóng to)
        hen = setInterval(() => { if (dat() && dang && !v.classList.contains("is-mo")) requestAnimationFrame(() => { if (dang) v.classList.add("is-mo"); }); }, 500);
      } else {
        v.classList.remove("is-mo");   // cuộn ngược lên; viên vẫn nằm đó (ngoài khung, bị cắt) — không cần gỡ
      }
    }
  };
}

// ---------------- 1b. THẢ TIM + CHAT NHANH (Đợt 573, thầy chốt mẫu v6 22/10/2026) ----------------
// Thiết kế chốt: `D:\OTHERS\CLAUDE\myLesson - thiet ke tim chat quan sat\mau-v6.html` + `THIET KE v1.md` mục 6–10.
//  · Tin thầy: viên trắng NGAY DƯỚI viên quan sát, CHÍNH GIỮA khung game, mũi tên tam giác giữa mép trên; TRÁI TIM TRẦN (có bóng,
//    không nền) treo ngoài cạnh phải — bấm nhiều lần, mỗi lần 1 tim bay cong lên ảnh thầy; dồn 1,5 s mới báo 1 lượt.
//  · Dưới tin: viên thuốc "↩ Trả lời" — bấm thì CHÍNH NÓ giãn thành ô gõ (≤ 80 chữ, chặn link). Gửi xong: lời em = viên thuốc
//    XANH NGỌC #0E7C6E (màu tin "của mình" myNetwork) + dấu ✓ trắng không nền ngoài cạnh phải; dưới chỉ còn viên thuốc.
//  · Tim thầy thả: rơi xuống từ ảnh thầy. Không tiếng, không dừng ván. 10 s không đụng ⇒ thu lại; đang gõ không thu.
// Trang mẹ (bai.html) đọc kho `quanSat/{ma}/tin` rồi chuyển vào: {type:'AWORD:QS_TIN', code, tin:{id, loai:'tim'|'chu', chu, n}}.
// Em trả lời ⇒ {type:'AWORD:QS_TRA', code, loai, n, chu, ve} lên trang mẹ — trang mẹ ghi `quanSat/{ma}/tra` (luật: chỉ khi
// thầy ĐANG xem đúng act này). Chỉ chạy khi viên đang bật (thầy đang xem).
const CSS_TIN = `
.aw-qt{position:absolute;left:50%;top:var(--qt-top,48px);z-index:61;display:flex;flex-direction:column;align-items:center;gap:8px;
  width:max-content;max-width:min(88%,380px);font-family:"Baloo 2","Segoe UI",system-ui,sans-serif;transform-origin:50% -6px;
  transform:translateX(-50%) translateY(-6px) scale(calc(var(--qs-k,1) * .6));opacity:0;pointer-events:none;
  transition:transform .35s cubic-bezier(.22,1.3,.36,1),opacity .2s}
.aw-qt.is-mo{transform:translateX(-50%) scale(var(--qs-k,1));opacity:1;pointer-events:auto}
.aw-qt *{box-sizing:border-box}
.aw-qt-dong{position:relative;display:flex;justify-content:center}
.aw-qt-ngoai{position:absolute;left:100%;top:50%;margin-left:6px;transform:translateY(-50%)}
.aw-qt-bb{position:relative;width:fit-content;max-width:300px;padding:7px 14px;border-radius:18px;background:#fff;color:#1E293B;
  font:600 14.5px/1.3 "Baloo 2","Segoe UI",system-ui,sans-serif;text-align:center;overflow-wrap:anywhere;box-shadow:0 6px 18px rgba(0,0,0,.35);user-select:text}
.aw-qt-thay::before{content:"";position:absolute;top:-6px;left:calc(50% - 7px);width:14px;height:7px;background:inherit;clip-path:polygon(50% 0,100% 100%,0 100%)}
.aw-qt-emd{display:none}
.aw-qt-emd.is-mo{display:flex;animation:awQtHien .3s cubic-bezier(.22,1.3,.36,1)}
@keyframes awQtHien{from{transform:translateY(-6px) scale(.85);opacity:0}}
.aw-qt-em{background:#0E7C6E;color:#fff}
.aw-qt-tich{width:22px;height:22px;display:grid;place-items:center;pointer-events:none}
.aw-qt-tich svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))}
.aw-qt-tim{width:34px;height:34px;margin:0 0 0 6px;border:0;padding:0;background:none;cursor:pointer;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
.aw-qt-tim svg{width:24px;height:24px;fill:#FF4D57;filter:drop-shadow(0 2px 4px rgba(0,0,0,.55));transition:transform .15s}
.aw-qt-tim:hover svg{transform:scale(1.12)}
.aw-qt-tim.is-vua svg{transform:scale(1.3)}
.aw-qt-thuoc{position:relative;flex:none;height:34px;width:98px;border-radius:99px;overflow:hidden;cursor:pointer;
  background:rgba(15,23,42,.62);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),0 4px 12px rgba(0,0,0,.25);
  transition:width .32s cubic-bezier(.22,1,.36,1),background .25s,box-shadow .25s}
.aw-qt-nhan{position:absolute;inset:0;margin:0;border:0;padding:0;background:none;color:inherit;cursor:pointer;display:flex;align-items:center;
  justify-content:center;gap:5px;font:700 13.5px "Baloo 2","Segoe UI",system-ui,sans-serif;white-space:nowrap;transition:opacity .15s;-webkit-tap-highlight-color:transparent}
.aw-qt-nhan svg,.aw-qt-gui svg{width:15px;height:15px}
.aw-qt-nhan svg{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.aw-qt-thuoc input{position:absolute;left:0;top:0;height:34px;width:calc(100% - 34px);margin:0;border:0;background:none;padding:0 6px 0 14px;
  font:600 14px "Baloo 2","Segoe UI",system-ui,sans-serif;color:#1E293B;outline:none;user-select:text;-webkit-user-select:text}
.aw-qt-gui{position:absolute;right:2px;top:2px;width:30px;height:30px;margin:0;border:0;padding:0;border-radius:50%;background:#0E7C6E;color:#fff;cursor:pointer;display:grid;place-items:center}
.aw-qt-gui svg{fill:currentColor;width:14px;height:14px}
.aw-qt-thuoc input,.aw-qt-gui{opacity:0;pointer-events:none;transition:opacity .2s .1s}
.aw-qt-thuoc.is-mo{width:min(260px,80vw);background:#fff;color:#1E293B;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:auto}
.aw-qt-thuoc.is-mo .aw-qt-nhan{opacity:0;pointer-events:none}
.aw-qt-thuoc.is-mo input,.aw-qt-thuoc.is-mo .aw-qt-gui{opacity:1;pointer-events:auto}
.aw-qt-thuoc.is-mo .aw-qt-gui:disabled{opacity:.45}
.aw-qt-bay,.aw-qt-roi{position:absolute;z-index:62;pointer-events:none}
.aw-qt-bay{width:18px;height:18px;margin:-9px 0 0 -9px}
.aw-qt-roi{width:22px;height:22px;margin:-11px 0 0 -11px;animation:awQtRoi 1.6s ease-out forwards}
.aw-qt-bay svg,.aw-qt-roi svg{width:100%;height:100%;fill:#FF4D57;filter:drop-shadow(0 1px 3px rgba(0,0,0,.45))}
@keyframes awQtRoi{0%{transform:translate(0,0) scale(.3);opacity:0}20%{opacity:1;transform:translate(var(--a),16px) scale(1.1)}100%{transform:translate(var(--b),110px) scale(.7);opacity:0}}
.aw-qs-av.is-nhan{animation:awQtNhan .35s}
@keyframes awQtNhan{40%{transform:scale(1.3)}}
@media (prefers-reduced-motion:reduce){.aw-qt,.aw-qt-thuoc{transition:none}.aw-qt-roi{animation:none;opacity:0}}
`;
const SVG_TIM = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.5h2c.7-1.4 2.2-2.5 4.3-2.5 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';
const CO_LINK = /(https?:|:\/\/|www\.|\.(com|vn|net|org|io|me|app|gg|ly|xyz|top|site|online|tv|cc|info|edu)([\/?#:]|\s|$))/i;   // = chat lớp myLesson
function taoTin(vien, code) {
  if (!document.getElementById("awQtCss")) {
    const s = document.createElement("style");
    s.id = "awQtCss"; s.textContent = CSS_TIN;
    document.head.appendChild(s);
  }
  const c = document.createElement("div");
  c.className = "aw-qt";
  c.innerHTML =
    '<div class="aw-qt-dong"><div class="aw-qt-bb aw-qt-thay"></div>' +
    '<button type="button" class="aw-qt-tim aw-qt-ngoai" title="Thả tim cho thầy" aria-label="Thả tim cho thầy">' + SVG_TIM + '</button></div>' +
    '<div class="aw-qt-dong aw-qt-emd"><div class="aw-qt-bb aw-qt-em"></div>' +
    '<span class="aw-qt-tich aw-qt-ngoai" title="Đã gửi cho thầy"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>' +
    '<div class="aw-qt-thuoc"><button type="button" class="aw-qt-nhan"><svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>Trả lời</button>' +
    '<input type="text" maxlength="80" placeholder="Trả lời thầy…" tabindex="-1" autocomplete="off" enterkeyhint="send">' +
    '<button type="button" class="aw-qt-gui" tabindex="-1" title="Gửi" aria-label="Gửi"><svg viewBox="0 0 24 24"><path d="M3 20.5 21 12 3 3.5l2.5 7L15 12l-9.5 1.5z"/></svg></button></div>';
  const $ = s => c.querySelector(s);
  const bbT = $(".aw-qt-thay"), emd = $(".aw-qt-emd"), bbE = $(".aw-qt-em"), tim = $(".aw-qt-tim"), th = $(".aw-qt-thuoc"),
    inp = th.querySelector("input"), gui = $(".aw-qt-gui");
  let ve = "", hen = null, don = 0, henDon = null;
  const bao = (o) => {
    if (window.parent === window) return;
    try { window.parent.postMessage(Object.assign({ type: "AWORD:QS_TRA", code, ve }, o), "*"); } catch (_) {}
  };
  // Phím gõ trong ô KHÔNG lọt xuống game (Anagram/TTA/… nghe phím ở document — pha nổi bọt).
  ["keydown", "keyup", "keypress"].forEach(k => inp.addEventListener(k, e => e.stopPropagation()));
  ["pointerdown", "mousedown", "touchstart", "click"].forEach(k => c.addEventListener(k, e => e.stopPropagation(), { passive: true }));
  const thuLai = (ms) => {
    clearTimeout(hen);
    hen = setTimeout(() => { if (!th.classList.contains("is-mo")) c.classList.remove("is-mo"); }, ms);
  };
  c.addEventListener("pointerenter", () => clearTimeout(hen));
  c.addEventListener("pointerleave", () => { if (c.classList.contains("is-mo")) thuLai(4000); });
  const capNut = () => { gui.disabled = !inp.value.trim(); };
  inp.addEventListener("input", capNut);
  function moGo(mo) {
    th.classList.toggle("is-mo", mo);
    inp.tabIndex = gui.tabIndex = mo ? 0 : -1;
    if (mo) { clearTimeout(hen); setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (_) { inp.focus(); } }, 120); }
    else { inp.blur(); thuLai(10000); }
  }
  $(".aw-qt-nhan").addEventListener("click", () => moGo(true));
  inp.addEventListener("keydown", e => {
    if (e.key === "Escape") { inp.value = ""; capNut(); moGo(false); }
    else if (e.key === "Enter") { e.preventDefault(); guiChu(); }
  });
  inp.addEventListener("blur", () => setTimeout(() => {
    if (th.classList.contains("is-mo") && !inp.value.trim() && document.activeElement !== gui) moGo(false);
  }, 150));
  function guiChu() {
    const v = inp.value.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!v) return;
    if (CO_LINK.test(v)) { inp.value = ""; inp.placeholder = "Không gửi link được nhé"; capNut(); return; }
    inp.value = ""; capNut();
    bbE.textContent = v;
    emd.classList.remove("is-mo"); void emd.offsetWidth; emd.classList.add("is-mo");
    moGo(false);
    bao({ loai: "chu", chu: v });
  }
  gui.addEventListener("click", guiChu);
  // ❤ của em: mỗi lần bấm 1 tim bay theo đường cong (Bezier bậc 2) từ trái tim lên ảnh thầy; dồn 1,5 s mới báo 1 lượt.
  tim.addEventListener("click", () => {
    const h = vien.hinh(), anh = vien.anh();
    if (h && anh) {
      const k = h.inner.getBoundingClientRect(), r = tim.getBoundingClientRect(), a = anh.getBoundingClientRect();
      const x0 = r.left - k.left + r.width / 2, y0 = r.top - k.top + r.height / 2, x1 = a.left - k.left + a.width / 2, y1 = a.top - k.top + a.height / 2;
      const cx = (x0 + x1) / 2 + (Math.random() * 60 - 30), cy = Math.min(y0, y1) + (y0 - y1) * 0.35;
      const t = document.createElement("span");
      t.className = "aw-qt-bay"; t.innerHTML = SVG_TIM; t.style.left = "0"; t.style.top = "0";
      h.inner.appendChild(t);
      const an = t.animate([0, 0.5, 1].map((p, i) => {
        const q = 1 - p, x = q * q * x0 + 2 * q * p * cx + p * p * x1, y = q * q * y0 + 2 * q * p * cy + p * p * y1;
        return { transform: "translate(" + x + "px," + y + "px) scale(" + [1, 1.25, 0.55][i] + ")", opacity: [1, 1, 0.9][i] };
      }), { duration: 700, easing: "cubic-bezier(.3,.6,.4,1)" });
      an.onfinish = () => { t.remove(); anh.classList.remove("is-nhan"); void anh.offsetWidth; anh.classList.add("is-nhan"); };
    }
    tim.classList.add("is-vua"); clearTimeout(tim._h); tim._h = setTimeout(() => tim.classList.remove("is-vua"), 350);
    don++; clearTimeout(henDon);
    henDon = setTimeout(() => { const n = Math.min(50, don); don = 0; bao({ loai: "tim", n }); }, 1500);
    thuLai(10000);
  });
  function dat() {
    const h = vien.hinh();
    if (!h) return false;
    if (c.parentNode !== h.inner) { c.classList.remove("is-mo"); h.inner.appendChild(c); }
    // Viên co tới 0,55 cho vừa khe đồng hồ–điểm trên điện thoại; tin + nút phải ĐỌC/BẤM được ⇒ hệ số riêng, không dưới 0,9.
    c.style.setProperty("--qs-k", Math.max(0.9, Math.min(1.2, h.k)).toFixed(3));
    c.style.setProperty("--qt-top", Math.round(h.top + 30 * h.k + 8) + "px");
    return true;
  }
  return {
    // tin thầy: chữ ⇒ hiện cả khối; tim ⇒ rơi từ ảnh thầy
    nhan(tinMoi) {
      if (!tinMoi || !dat()) return;
      if (tinMoi.loai === "tim") {
        const h = vien.hinh(), anh = vien.anh();
        if (!h || !anh) return;
        const k = h.inner.getBoundingClientRect(), a = anh.getBoundingClientRect();
        const n = Math.max(1, Math.min(8, Number(tinMoi.n) || 1));
        for (let i = 0; i < n; i++) setTimeout(() => {
          const t = document.createElement("span");
          t.className = "aw-qt-roi"; t.innerHTML = SVG_TIM;
          t.style.left = (a.left - k.left + a.width / 2) + "px"; t.style.top = (a.top - k.top + a.height) + "px";
          t.style.setProperty("--a", (Math.random() * 24 - 12) + "px"); t.style.setProperty("--b", (Math.random() * 70 - 35) + "px");
          h.inner.appendChild(t); setTimeout(() => t.remove(), 1700);
        }, i * 130);
        return;
      }
      const chu = String(tinMoi.chu || "").slice(0, 120);
      if (!chu) return;
      ve = String(tinMoi.id || "").slice(0, 40);
      bbT.textContent = chu;
      emd.classList.remove("is-mo"); th.classList.remove("is-mo"); inp.value = ""; capNut();
      c.classList.remove("is-mo"); void c.offsetWidth;
      requestAnimationFrame(() => { c.classList.add("is-mo"); thuLai(10000); });
    },
    tat() { clearTimeout(hen); th.classList.remove("is-mo"); inp.blur(); c.classList.remove("is-mo"); },
    dat
  };
}

// Nghe cờ quan sát cho bài `code`. `khiDoi(dang)` gọi mỗi lần bật/tắt. Trả về hàm hỏi "đang bị quan sát?".
export function ngheQuanSat(code, khiDoi) {
  let dang = false, vien = null, tin = null, henDat = null;
  window.addEventListener("message", e => {
    if (!VE_NGUON.includes(e.origin)) return;
    const d = e.data;
    if (!d || d.code !== code) return;
    // Đợt 573 — tin thầy (chỉ khi viên đang bật)
    if (d.type === "AWORD:QS_TIN") {
      if (!dang || !vien || !d.tin) return;
      if (!tin) tin = taoTin(vien, code);
      tin.nhan(d.tin);
      return;
    }
    if (d.type !== "AWORD:QUAN_SAT") return;
    const moi = !!d.dang;
    if (moi === dang) return;
    dang = moi;
    if (!vien) vien = taoVien();
    vien.bat(dang);
    clearInterval(henDat); henDat = null;
    if (!dang && tin) tin.tat();
    if (dang) henDat = setInterval(() => { if (tin) tin.dat(); }, 500);   // ván mới / xoay màn ⇒ theo viên
    try { khiDoi && khiDoi(dang); } catch (_) {}
  });
  // Báo trang mẹ: khung này đã nghe ⇒ mẹ gửi ngay trạng thái hiện tại (khung mở SAU khi thầy đã bấm XEM).
  if (window.parent !== window) {
    try { window.parent.postMessage({ type: "AWORD:QS_SAN", code }, "*"); } catch (_) {}
  }
  return () => dang;
}

// ---------------- 2. CHẾ ĐỘ XEM CỦA THẦY ----------------
export function xemVan(app, assignment, { ten = "", lop = "" } = {}) {
  napCss();
  document.documentElement.classList.add("aw-xem");
  // Không tiếng: tắt âm của engine + mọi thẻ audio/video (giọng đọc, băng nghe).
  try { if (!sound.isMuted()) sound.toggle(); } catch (_) {}
  const goc = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { this.muted = true; this.volume = 0; return goc.apply(this, a); };
  // Tấm chắn: thầy chỉ XEM — không chạm/gõ được vào ván của em.
  const chan = document.createElement("div");
  chan.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:transparent;cursor:default";
  document.body.appendChild(chan);
  ["keydown", "keyup", "keypress", "wheel"].forEach(k => window.addEventListener(k, e => { e.stopPropagation(); e.preventDefault(); }, { capture: true, passive: false }));

  const thongBao = (tieuDe, phu) => {
    app.innerHTML = "";
    const w = document.createElement("div");
    w.style.cssText = "min-height:100vh;display:grid;place-items:center;font:600 16px 'Baloo 2',system-ui,sans-serif;color:#475569;text-align:center;padding:24px";
    w.innerHTML = '<div><div style="font-size:22px;font-weight:800;color:#16232A;margin-bottom:6px"></div><div></div></div>';
    w.firstChild.firstChild.textContent = tieuDe;
    w.firstChild.lastChild.textContent = phu || "";
    app.appendChild(w);
  };
  let cuoi = "", soLuot = 0;
  function dung(tt) {
    if (!tt || !tt.tplJ) {
      cuoi = "";
      thongBao("Em không có ván đang làm dở", "Em chưa vào ván, vừa làm xong, hoặc vừa rời ván. Em trả lời câu tiếp theo là ván hiện ra ngay.");
      return;
    }
    if (tt.tplJ === cuoi) return;
    let tpl = null;
    try { tpl = JSON.parse(tt.tplJ); } catch (_) { tpl = null; }
    if (!tpl || typeof tpl !== "object") return;
    cuoi = tt.tplJ;
    const gio = Number.isFinite(Number(tt.gioMs)) ? Number(tt.gioMs) : (Number(tt.activeMs) || 0);
    let lay = { tpl, timeCost: Number(tt.timeCost) || 0, daChoiMs: Math.max(0, gio) };
    // ⭐ Đợt 497 — BÀI LÀM TỪNG CÂU cho dashboard (thầy thấy đáp án em VỪA chọn — ván khôi phục đã nhảy sang câu kế):
    // playLog GIẢ (mọi hàm rỗng, KHÔNG ghi gì) chỉ để engine trao `baiLamNay` (= template buildReview, Đợt 384); ván dựng
    // xong ⇒ đọc bài làm, rút gọn, gửi trang mẹ {type:'AWORD:XEM_BL', code, rv:[{q,a,y,ok,c,o}]}. Template không có
    // buildReview (Gameshow, Open the box…) ⇒ rv null.
    const luot = ++soLuot;
    let docBL = null;
    const guiBL = (rv) => {
      if (window.parent === window) return;
      try { window.parent.postMessage({ type: "AWORD:XEM_BL", code: assignment.code, rv }, "*"); } catch (_) {}
    };
    const rutGon = (r) => r.map(q => ({
      q: String((q && q.question) || "").slice(0, 400),
      a: !!(q && q.answered),
      y: q && q.yourText != null ? String(q.yourText).slice(0, 300) : null,
      ok: !!(q && q.yourCorrect),
      c: String((q && q.correctText) || "").slice(0, 300),
      o: q && q.src && Array.isArray(q.src.answers) ? q.src.answers.map(x => String((x && x.text) || "").slice(0, 120)).slice(0, 8)
         : (q && Array.isArray(q.opts) ? q.opts.map(x => String(x).slice(0, 120)).slice(0, 8) : null)
    }));
    let thu = 0;
    const doiBL = () => {
      if (luot !== soLuot) return;
      let r = null;
      try { r = docBL ? docBL() : null; } catch (_) { r = null; }
      if (Array.isArray(r) && r.length) { guiBL(rutGon(r)); return; }
      if (++thu < 25) setTimeout(doiBL, 200); else guiBL(null);
    };
    setTimeout(doiBL, 300);
    startGame(app, JSON.parse(JSON.stringify(assignment.activity)), {
      hwPreset: "submit",   // tự bấm START (READY bị ẩn bằng html.aw-xem)
      session: {
        playerName: ten, className: lop,
        endOptions: assignment.endOptions || {},
        choVaoVan: () => null,
        cheDoMenu: () => "an",
        lamTiepNhan: () => ({ daLam: tpl.daLam, tong: tpl.tong }),
        layLamTiep: () => { const s = lay; lay = null; return s; },
        luuLamTiep: () => {},
        choLamTiep: null,
        meta: { assignmentTitle: assignment.title || "", code: assignment.code },
        submit: () => Promise.resolve({ ok: true }),
        retrySubmit: () => Promise.resolve({ ok: true }),
        attemptId: () => "",
        playLog: { start: (o) => { docBL = o && typeof o.baiLamNay === "function" ? o.baiLamNay : null; }, beat() {}, end() {}, leave() {} },   // Đợt 497 — GIẢ, không ghi
        entries: async () => []
      }
    });
  }
  window.addEventListener("message", e => {
    if (!VE_NGUON.includes(e.origin)) return;
    const d = e.data;
    if (!d || d.type !== "AWORD:XEM_TT" || d.code !== assignment.code) return;
    dung(d.tt || null);
  });
  thongBao("Đang chờ ván của em…", "");
  if (window.parent !== window) {
    try { window.parent.postMessage({ type: "AWORD:XEM_SAN", code: assignment.code }, "*"); } catch (_) {}
  }
}
