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
    return true;
  }
  return {
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

// Nghe cờ quan sát cho bài `code`. `khiDoi(dang)` gọi mỗi lần bật/tắt. Trả về hàm hỏi "đang bị quan sát?".
export function ngheQuanSat(code, khiDoi) {
  let dang = false, vien = null;
  window.addEventListener("message", e => {
    if (!VE_NGUON.includes(e.origin)) return;
    const d = e.data;
    if (!d || d.type !== "AWORD:QUAN_SAT" || d.code !== code) return;
    const moi = !!d.dang;
    if (moi === dang) return;
    dang = moi;
    if (!vien) vien = taoVien();
    vien.bat(dang);
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
