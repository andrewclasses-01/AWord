// =============================================================
// bo-cuoc.js — ⭐⭐ Đợt 424 (28/09/2026, thầy chốt mẫu C3) — "EM ĐÃ START AGAIN QUÁ SỚM"
// =============================================================
// Nhiều em làm 1–2 câu rồi bấm Start again ngay, không bao giờ làm hết bài để học từ câu sai
// (Show mistakes · Start with mistakes). Trang HỌC SINH (play.js) đếm số lần BỎ CUỘC LIÊN TIẾP ở
// từng act và hiện một tấm hướng dẫn (đếm ngược 8 giây mới cho đóng).
//
// LUẬT (thầy chốt qua AskUserQuestion 28/09):
//   · "Bỏ cuộc" = rời ván khi mới làm DƯỚI 50% số câu (Start again · về trang bài · tải lại · đóng tab).
//     Số câu đã làm: bài làm giữa ván của template (`answered`, 7 template có setReviewProvider); template
//     không có ⇒ điểm ÷ số câu (xấp xỉ). Rời ván khi đã làm ≥ 50% ⇒ chuỗi về 0 (em có cố gắng).
//   · Lần nhắc ĐẦU sau 2 lần bỏ liền; mỗi lần nhắc sau cần thêm 1 (3, 4, …) — nhớ theo act + mã em, trên máy.
//   · Làm HẾT một ván ⇒ chuỗi về 0 (số lần đã nhắc giữ nguyên).
//   · Ván Start with mistakes không tính; phụ huynh (`db=1`) không nhắc.
//   · ⭐ Đợt 456 (04/10/2026, thầy chốt): em ĐÃ ĐẠT 100% ở act này (một lượt làm hết, điểm = số câu) ⇒ KHÔNG BAO GIỜ nhắc
//     nữa ở act đó — em đang cày xếp hạng, không còn vì mục tiêu làm đủ bài. Cờ `hoan` lưu theo act + mã em; máy khác
//     thì trang học sinh đọc bảng điểm tốt nhất của máy chủ MỘT lần/act/máy (`canKiemMayChu`) để biết.
//   · Bỏ bằng tải lại / đóng tab (trang chết, không hiện được) ⇒ cờ `cho`, hiện ngay lần mở bài sau.
//   · Bước 2 "Xem các câu sai" chỉ có khi bài bật Show answers (`endOptions.showAnswers !== false`) — thầy chọn (b).
//
// Pop-up: tấm trượt đáy (điện thoại) / thẻ giữa (khung rộng hoặc ngang), 5 bước 2 cột khi ngang-thấp.
// ⛔ KHÔNG BAO GIỜ CUỘN: `vuaKhung` chọn cỡ chữ `--f` LỚN NHẤT (9–19px) mà cả tấm vừa khung — đo lại khi
// đổi cỡ cửa sổ VÀ khi font tải xong (bộ chữ Baloo 2 có dấu chỉ tải khi chữ có dấu xuất hiện ⇒ lần đo đầu
// dùng font dự phòng, tải xong chữ cao thêm ~20px — bắt được lúc làm mẫu).
// Mẫu duyệt: scratch/dot423-mau/c3.html (bị ignore).

const KHOA = "aword-bo-cuoc";
const NGUONG_DAU = 2;
const TI_LE_BO = 0.5;
const GIAY_DEM = 8;

function docKho() { try { return JSON.parse(localStorage.getItem(KHOA) || "{}") || {}; } catch (e) { return {}; } }
function ghiKho(m) { try { localStorage.setItem(KHOA, JSON.stringify(m)); } catch (e) { /* riêng tư: tắt tính năng */ } }
const khoaAct = (code, ma, ten) => String(code) + "|" + (ma ? String(ma) : "ten:" + String(ten || "").trim().toLowerCase());

// Tỉ lệ câu đã làm của ván vừa rời. `review` = bài làm giữa ván (null nếu template không cung cấp).
export function tiLeDaLam({ review, score, total }) {
  if (Array.isArray(review) && review.length) {
    const co = review.some(r => r && typeof r.answered === "boolean");
    if (co) return review.filter(r => r && r.answered === true).length / review.length;
  }
  const t = Number(total) || 0;
  if (t <= 0) return null;
  return Math.min(1, Math.max(0, (Number(score) || 0) / t));
}

// Em rời ván giữa chừng. Trả số lần bỏ liền (để hiện) khi tới ngưỡng, không thì 0.
// `trangChet` = pagehide: không hiện được ⇒ cất cờ `cho` cho lần mở sau.
export function ghiRoiVan({ code, ma, ten, tiLe, trangChet = false }) {
  if (tiLe == null) return 0;
  const m = docKho(), k = khoaAct(code, ma, ten), o = m[k] || { lien: 0, daNhac: 0, cho: 0 };
  if (o.hoan) return 0;   // Đợt 456 — đã đạt 100% ở act này: cày xếp hạng, không nhắc
  if (tiLe >= TI_LE_BO) { o.lien = 0; m[k] = o; ghiKho(m); return 0; }
  o.lien = (o.lien || 0) + 1;
  let hien = 0;
  if (o.lien >= NGUONG_DAU + (o.daNhac || 0)) {
    hien = o.lien;
    o.daNhac = (o.daNhac || 0) + 1;
    o.lien = 0;
    if (trangChet) { o.cho = hien; hien = 0; }
  }
  m[k] = o; ghiKho(m);
  return hien;
}
// Em làm HẾT một ván ⇒ chuỗi về 0.
export function ghiXongVan({ code, ma, ten }) {
  const m = docKho(), k = khoaAct(code, ma, ten), o = m[k];
  if (!o || !o.lien) return;
  o.lien = 0; m[k] = o; ghiKho(m);
}
// Lần mở bài: có nhắc đang chờ (bỏ bằng đóng tab/tải lại) thì lấy ra (và xoá cờ).
export function layNhacCho({ code, ma, ten }) {
  const m = docKho(), k = khoaAct(code, ma, ten), o = m[k];
  if (!o || !o.cho) return 0;
  const n = o.cho; o.cho = 0; m[k] = o; ghiKho(m);
  return o.hoan ? 0 : n;   // Đợt 456 — đã đạt 100% ⇒ bỏ luôn nhắc đang chờ
}
// ⭐ Đợt 456 — em đã đạt 100% ở act này ⇒ từ nay không đếm bỏ cuộc, không nhắc.
export function ghiDat100({ code, ma, ten }) {
  const m = docKho(), k = khoaAct(code, ma, ten), o = m[k] || { lien: 0, daNhac: 0, cho: 0 };
  if (o.hoan) return;
  o.hoan = 1; o.lien = 0; o.cho = 0; m[k] = o; ghiKho(m);
}
export function daDat100({ code, ma, ten }) {
  const o = docKho()[khoaAct(code, ma, ten)];
  return !!(o && o.hoan);
}
// Máy này chưa biết em có từng đạt 100% ở máy khác không ⇒ hỏi máy chủ ĐÚNG MỘT LẦN cho mỗi act (cờ `kiem`).
export function canKiemMayChu({ code, ma, ten }) {
  const o = docKho()[khoaAct(code, ma, ten)];
  return !(o && (o.hoan || o.kiem));
}
export function ghiDaKiem({ code, ma, ten }) {
  const m = docKho(), k = khoaAct(code, ma, ten), o = m[k] || { lien: 0, daNhac: 0, cho: 0 };
  o.kiem = 1; m[k] = o; ghiKho(m);
}

// ---------------- giao diện ----------------
const CSS = `
.aw-bc-phu { position:fixed; inset:0; z-index:2147483000; display:flex; align-items:flex-end; justify-content:center;
  container-type:size; background:rgba(18,32,52,.55); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
  animation:awBcMo .25s ease both; font-family:"Baloo 2","Segoe UI",system-ui,Arial,sans-serif; color:#23303e; }
@keyframes awBcMo { from { opacity:0 } }
.aw-bc-phu * { box-sizing:border-box; }
.aw-bc { --f:15px; font-size:var(--f); position:relative; width:100%; max-width:34em; display:flex; flex-direction:column; overflow:hidden;
  background:#fff; border-radius:1.8em 1.8em 0 0; box-shadow:0 -10px 50px rgba(0,0,0,.3); padding:.55em 1.25em 1em;
  padding-bottom:max(1em, env(safe-area-inset-bottom)); animation:awBcTruot .42s cubic-bezier(.2,1,.3,1) both; text-align:left; }
@keyframes awBcTruot { from { transform:translateY(100%) } }
@container (min-width: 600px), (min-aspect-ratio: 5/4) {
  .aw-bc-phu { align-items:center; }
  .aw-bc { border-radius:1.8em; animation:awBcNay .35s cubic-bezier(.2,1.4,.4,1) both; }
  .aw-bc-keo { display:none; }
}
@keyframes awBcNay { from { transform:scale(.9); opacity:0 } }
.aw-bc-keo { width:3em; height:.32em; border-radius:1em; background:#d6dfea; margin:0 auto .45em; flex:none; }
.aw-bc-brand { flex:none; text-align:center; font-family:system-ui,"Segoe UI",Roboto,Arial,sans-serif; font-weight:300; font-size:.72em;
  letter-spacing:.34em; text-indent:.34em; text-transform:uppercase; color:#9aa3af; margin:.2em 0 .6em; }
.aw-bc-dem { flex:none; height:.38em; border-radius:1em; background:#edf2f8; overflow:hidden; }
.aw-bc-dem i { display:block; width:0; height:100%; border-radius:1em; background:linear-gradient(90deg,#ffb020,#ff7a45); }
.aw-bc-dau { flex:none; display:flex; gap:.8em; align-items:center; margin:.8em 0 .75em; }
.aw-bc-mat { flex:none; width:3.3em; height:3.3em; border-radius:1.05em; background:linear-gradient(135deg,#ffcf5c,#ff9d2e);
  display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 .35em .9em rgba(255,157,46,.4); }
.aw-bc-mat svg { width:1.9em; height:1.9em; }
.aw-bc h2 { margin:0; font-size:1.38em; font-weight:800; line-height:1.12; }
.aw-bc h2 b { color:#e8590c; font-weight:800; }
.aw-bc-phude { margin:.15em 0 0; font-size:.95em; font-weight:600; color:#6b7a8c; line-height:1.25; }
.aw-bc-ds { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:1fr; gap:.42em; }
.aw-bc-buoc { display:flex; gap:.75em; align-items:center; padding:.5em .75em; border-radius:1em; background:#f5f8fc;
  font-size:.97em; font-weight:600; line-height:1.3; }
.aw-bc-buoc b { font-weight:800; }
.aw-bc-bi { position:relative; flex:none; width:2.35em; height:2.35em; border-radius:.75em; display:flex; align-items:center; justify-content:center; }
.aw-bc-bi svg { width:1.3em; height:1.3em; }
.aw-bc-bi em { position:absolute; top:-.35em; left:-.35em; width:1.15em; height:1.15em; border-radius:50%; background:#23303e; color:#fff;
  font-size:.72em; font-weight:800; font-style:normal; line-height:1.15em; text-align:center; }
.aw-bc-buoc.vo { background:#f3efff; box-shadow:inset 0 0 0 1.5px #ddd3ff; }
.aw-bc-nn { display:inline-block; padding:0 .5em; border-radius:.55em; font-weight:800; white-space:nowrap; line-height:1.35; }
.aw-bc-nn.show { background:#eef3fa; color:#3d4c5e; box-shadow:inset 0 0 0 1.5px #cdd8e6; }
.aw-bc-nn.mis { background:#fff6e2; color:#b87400; box-shadow:inset 0 0 0 1.5px #ffd27a; }
.aw-bc-nn.lai { background:#e6f7ee; color:#128a52; box-shadow:inset 0 0 0 1.5px #a9e3c5; }
.aw-bc-ghi { flex:none; margin:.7em 0; text-align:center; font-size:.92em; font-weight:700; color:#2f7bff; line-height:1.3; }
.aw-bc-nut { flex:none; width:100%; border:0; border-radius:1em; padding:.62em 1em; font:800 1.12em "Baloo 2","Segoe UI",sans-serif; color:#fff;
  background:#2f7bff; cursor:pointer; box-shadow:0 .25em 0 #1f5fd0; transition:background .2s; }
.aw-bc-nut:active:not(:disabled) { transform:translateY(2px); box-shadow:0 .12em 0 #1f5fd0; }
.aw-bc-nut:disabled { cursor:not-allowed; background:#9fb3cc; box-shadow:0 .25em 0 #8497ae; }
.aw-bc-nut:focus-visible { outline:3px solid #9cc2ff; outline-offset:2px; }
@container (min-aspect-ratio: 5/4) and (max-height: 620px) {
  .aw-bc { max-width:60em; }
  .aw-bc-ds { grid-template-columns:1fr 1fr; }
  .aw-bc-ds li:last-child:nth-child(odd) { grid-column:1 / -1; }
}
@media (prefers-reduced-motion: reduce) { .aw-bc-phu, .aw-bc { animation:none !important; } }
`;
let _daCss = false;
function napCss() {
  if (_daCss) return;
  _daCss = true;
  const s = document.createElement("style");
  s.id = "aw-bo-cuoc-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const S = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
const IC = {
  bong: S('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>'),
  but: S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  mat: S('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  vo: S('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  lap: S('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>'),
  cup: S('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>')
};

function ruot(lan, coShow) {
  const buoc = [
    ["background:#e8f0ff;color:#2f7bff", IC.but, "<b>Làm hết một lượt</b> — bất kể đúng hay sai, em hãy làm toàn bộ tất cả các câu hỏi."],
    coShow ? ["background:#e6f2fb;color:#1f86c7", IC.mat, '<b>Xem các câu sai</b>: bấm <span class="aw-bc-nn show">Show mistakes</span> ở menu cuối game.'] : null,
    ["background:#e7e0ff;color:#7c5cff", IC.vo, "<b>Ghi các câu bị sai ra vở</b> để phân tích tại sao lại sai, học và ghi nhớ kiến thức thực sự của các câu này.", "vo"],
    ["background:#fff3dc;color:#b87400", IC.lap, 'Bấm <span class="aw-bc-nn mis">Start with mistakes</span> để luyện tập lại đúng những câu bị sai.'],
    ["background:#e3f7ee;color:#18a867", IC.cup, 'Bấm <span class="aw-bc-nn lai">Start again</span> để làm lại một lượt mới với kiến thức đã sẵn sàng.']
  ].filter(Boolean);
  const li = buoc.map((b, i) => `<li class="aw-bc-buoc${b[3] ? " " + b[3] : ""}"><div class="aw-bc-bi" style="${b[0]}">${b[1]}<em>${i + 1}</em></div><span>${b[2]}</span></li>`).join("");
  return `<div class="aw-bc" role="dialog" aria-modal="true" aria-labelledby="awBcT">
  <div class="aw-bc-keo"></div><div class="aw-bc-brand">Andrew Classes</div><div class="aw-bc-dem"><i></i></div>
  <div class="aw-bc-dau"><div class="aw-bc-mat">${IC.bong}</div>
    <div><h2 id="awBcT">Em đã Start Again quá sớm <b>${Math.max(2, lan | 0)} lần liền</b>!</h2><p class="aw-bc-phude">Hãy thử cách học hiệu quả hơn dưới đây.</p></div></div>
  <ol class="aw-bc-ds">${li}</ol>
  <div class="aw-bc-ghi">Bỏ cuộc giữa chừng (bấm <b>Start again</b> ngay khi sai) thì em không biết mình sai ở đâu!</div>
  <button type="button" class="aw-bc-nut" disabled></button>
</div>`;
}

// Cỡ chữ LỚN NHẤT mà tấm vừa khung (tấm đáy chừa khe 10px, thẻ nổi chừa 24px). Chiều cao giảm đều theo --f.
function vuaKhung(phu) {
  const bc = phu.querySelector(".aw-bc");
  if (!bc) return;
  const noi = getComputedStyle(phu).alignItems === "center";
  const tran = phu.clientHeight - (noi ? 24 : 10);
  const vua = f => { bc.style.setProperty("--f", f + "px"); return bc.offsetHeight <= tran; };
  let lo = 9, hi = 19;
  if (vua(hi)) return;
  for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; if (vua(m)) lo = m; else hi = m; }
  vua(Math.floor(lo * 4) / 4);
}

let _dangMo = null;   // Promise của tấm đang mở (một lúc chỉ một tấm)
export function dangMo() { return _dangMo; }

// Hiện tấm. Trả Promise xong khi em bấm "Em hiểu rồi".
export function hienNhac({ lan, coShow }) {
  if (_dangMo) return _dangMo;
  napCss();
  const phu = document.createElement("div");
  phu.className = "aw-bc-phu";
  phu.innerHTML = ruot(lan, coShow);
  // Game đang toàn màn hình (engine giữ fullscreen trên khung gốc) ⇒ gắn vào đó, gắn vào body sẽ không thấy.
  (document.fullscreenElement || document.webkitFullscreenElement || document.body).appendChild(phu);
  const nut = phu.querySelector(".aw-bc-nut"), thanh = phu.querySelector(".aw-bc-dem i");
  const bao = () => { try { vuaKhung(phu); } catch (e) { /* đo hỏng: giữ cỡ mặc định */ } };
  bao();   // ngay — ResizeObserver chỉ bắn khi trang được vẽ
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(bao) : null;
  if (ro) ro.observe(phu); else window.addEventListener("resize", bao);
  const f = document.fonts;
  if (f) { f.ready.then(bao).catch(() => {}); f.addEventListener && f.addEventListener("loadingdone", bao); }
  // Chặn phím xuống game phía dưới (game gõ chữ nghe phím ở window) — trừ Tab/Enter/Space trên chính nút.
  const chanPhim = e => {
    if (e.target === nut && (e.key === "Enter" || e.key === " " || e.key === "Tab")) return;
    e.stopPropagation();
    if (e.key !== "Tab") e.preventDefault();
  };
  window.addEventListener("keydown", chanPhim, true);
  window.addEventListener("keyup", chanPhim, true);
  const t0 = performance.now();
  let hen = null;
  const ve = () => {
    const con = Math.max(0, GIAY_DEM - (performance.now() - t0) / 1000);
    thanh.style.width = ((1 - con / GIAY_DEM) * 100) + "%";
    if (con > 0) { nut.textContent = "Đọc kỹ nhé… " + Math.ceil(con); return; }
    clearInterval(hen); hen = null;
    nut.disabled = false; nut.textContent = "Em hiểu rồi — làm hết bài!";
    try { nut.focus({ preventScroll: true }); } catch (e) {}
  };
  ve(); hen = setInterval(ve, 100);
  _dangMo = new Promise(xong => {
    nut.addEventListener("click", () => {
      if (nut.disabled) return;
      if (hen) clearInterval(hen);
      if (ro) ro.disconnect(); else window.removeEventListener("resize", bao);
      if (f && f.removeEventListener) f.removeEventListener("loadingdone", bao);
      window.removeEventListener("keydown", chanPhim, true);
      window.removeEventListener("keyup", chanPhim, true);
      phu.remove();
      _dangMo = null;
      xong();
    });
  });
  return _dangMo;
}
