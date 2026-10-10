// =============================================================
// kiemtra2.js — TRANG LÀM BÀI KIỂM TRA ĐẦU VÀO · BỘ ĐỀ LỚP 3–4 (kiemtra2.html?g=<mã bài giao>&n=<tên>&ma=<ID>&nhung=1)
// Đợt 498 — thầy Andrew chốt 10/10/2026. Nhúng trong kiemtra.andrewclasses.com (bộ đề "B", 6 phần, mỗi phần một khung).
//
// Vì sao một TRANG RIÊNG (không sửa kiemtra.js): bộ đề cũ (3 phần Type the answer) đang chạy thật; bộ mới đổi gần như mọi thứ
//   (giới hạn giờ TỪNG CÂU + tự sang câu khi hết giờ, Quiz, hình minh hoạ, phim trí nhớ, KHÔNG làm lại, KHÔNG quay lại câu trống).
//   Dùng CHUNG: bài giao + kho điểm `scores`/`results`/`practiceLog` + VÉ đăng nhập của em + phép chấm kiemtra-cham.js.
//
// Nội dung đọc từ act của bài giao (a.activity):
//   content.kiemTra = { bo:'B', phan:1..6, loai:'quiz-tu'|'go-tu'|'a-an'|'so-nhieu'|'tao-cau'|'tri-nho', giay, de, dan[], thu[], phim? }
//   Quiz (type 'quiz')            : content.questions[{ question, answers[{text, correct}], hinh?, giay? }]
//   Type the answer               : content.items[{ prompt, acceptedAnswers[], hinh?, so?, mot?, giay? }]
//     so-nhieu: hinh = tên hình (kiemtra2/hinh/<hinh>.svg), mot = từ số ít ("rabbit"), so = số lượng hình bên phải (2/3/4).
//   tri-nho: kiemTra.phim = "kiemtra2/phim/phim.js" (module taoPhim) — xem xong (không tua, không dừng) mới tới câu hỏi.
//
// Luật làm bài (thầy chốt): mỗi câu có GIỜ riêng (thanh thời gian hiện cho em thấy, cam khi còn 1/3) · hết giờ tự sang câu sau
//   (Type: lấy chữ đang có trong ô) · làm MỘT lần · không báo đúng/sai · tải lại trang ⇒ về đúng câu đang làm, đồng hồ của câu
//   KHÔNG tính lại (mốc hết giờ tính theo giờ thật, lưu trên máy).
// Ghi NGẦM vào từng hàng `review`: ms, giay (giới hạn), hetGio, anMs/roi, mat/matMs, dan, phim (phím gõ), chon (Quiz: số ô chọn).
//   Hàng đầu mang `kt` = tóm tắt lượt (bộ đề, phần, tải lại, xem hướng dẫn, làm thử, phim…).
// =============================================================

import {
  getAssignment, queueAttempt, queueAttemptKeepalive, sendAttempt, flushOutbox, sanVe, listScores,
  newPlayLogId, beatPlayLog
} from "./core/assignments.js";
import { gioChuan } from "./core/gio-chuan.js";
import { guardVnTyping } from "./core/vn-guard.js";
import { dung } from "./kiemtra-cham.js";

const Q = new URLSearchParams(location.search);
if (Q.get("nhung") === "1") document.documentElement.classList.add("kt-nhung");
const CODE = (Q.get("g") || "").trim();
const TEN = (Q.get("n") || "").trim().replace(/\s+/g, " ").slice(0, 40);
const MA = (Q.get("ma") || "").trim().replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
const app = document.getElementById("app");
const THU_MAY = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

// ---------- tiện ích DOM (chỉ textContent — dữ liệu từ kho không bao giờ thành HTML) ----------
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function nut(text, cls, onClick) {
  const b = h("button", "kt-btn " + (cls || ""), text);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}
const cho = ms => new Promise(r => setTimeout(r, ms));
function baoMe(trangThai, them) {
  if (window.parent === window) return;
  try { window.parent.postMessage({ type: "AWORD:KT", code: CODE, trangThai, ...(them || {}) }, "*"); } catch (e) { /* trang mẹ khó tính */ }
}
// tên hình an toàn ⇒ đường dẫn trong kho AWord (chỉ chữ thường, số, gạch ngang)
const hinhUrl = ten => new URL("kiemtra2/hinh/" + String(ten || "").toLowerCase().replace(/[^a-z0-9-]/g, "") + ".svg", import.meta.url).href;
function anh(ten, cls) {
  const i = h("img", cls || "k2-hinh");
  i.alt = ""; i.draggable = false; i.decoding = "async";
  i.src = hinhUrl(ten);
  return i;
}
function thietBi() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const he = /iPhone|iPod/.test(ua) ? "iPhone" : (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) ? "iPad"
    : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /CrOS/.test(ua) ? "Chromebook" : "Máy khác";
  const tr = /Zalo/i.test(ua) ? "Zalo" : /FBAN|FBAV|FB_IAB/.test(ua) ? "Facebook" : /Edg/.test(ua) ? "Edge"
    : /FxiOS|Firefox/.test(ua) ? "Firefox" : /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "trình duyệt khác";
  return he + " · " + tr;
}

// ---------- lưu tiến độ trên máy ----------
const KHOA_LUU = `aword-kt2-${CODE}-${MA || TEN}`;
const KHOA_XONG = `aword-kt-xong-${CODE}-${MA || TEN}`;
function docLuu() { try { return JSON.parse(localStorage.getItem(KHOA_LUU) || "null"); } catch (e) { return null; } }
function ghiLuu(s) { try { localStorage.setItem(KHOA_LUU, JSON.stringify(s)); } catch (e) { /* riêng tư: thôi */ } }
function xoaLuu() { try { localStorage.removeItem(KHOA_LUU); } catch (e) { /* thôi */ } }

// ---------- chuẩn hoá nội dung bài giao thành danh sách câu ----------
// Mỗi câu: { kieu:'chon'|'go', de, hinh, so, mot, dap:[...], dapDung, chon:[...], giay }
function cauTuAct(act, kt) {
  const g0 = Math.max(3, Math.min(120, +kt.giay || 10));
  const giay = x => Math.max(3, Math.min(180, +x || g0));
  if (act.type === "quiz") {
    return (act.content && Array.isArray(act.content.questions) ? act.content.questions : [])
      .filter(q => q && q.question && Array.isArray(q.answers) && q.answers.some(a => a && a.correct))
      .map(q => ({ kieu: "chon", de: String(q.question), hinh: q.hinh || "", chon: q.answers.map(a => String(a.text || "")),
        dapDung: q.answers.findIndex(a => a && a.correct), giay: giay(q.giay) }));
  }
  return (act.content && Array.isArray(act.content.items) ? act.content.items : [])
    .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length)
    .map(it => ({ kieu: "go", de: String(it.prompt), hinh: it.hinh || "", so: +it.so || 0, mot: it.mot || "", dap: it.acceptedAnswers.map(String), giay: giay(it.giay) }));
}
function cauThu(kt, act) {
  return (Array.isArray(kt.thu) ? kt.thu : []).map(t => (act.type === "quiz"
    ? { kieu: "chon", de: String(t.question || ""), hinh: t.hinh || "", chon: (t.answers || []).map(a => String(a.text || "")), dapDung: (t.answers || []).findIndex(a => a && a.correct), giay: +t.giay || +kt.giay || 10, huongDan: t.huongDan || "" }
    : { kieu: "go", de: String(t.prompt || ""), hinh: t.hinh || "", so: +t.so || 0, mot: t.mot || "", dap: (t.acceptedAnswers || []).map(String), giay: +t.giay || +kt.giay || 15, huongDan: t.huongDan || "" }))
    .filter(c => c.de && (c.kieu === "go" ? c.dap.length : c.dapDung >= 0));
}

// ---------- khung trang ----------
let khung = null;
function dungKhung(act) {
  app.innerHTML = "";
  const k = h("div", "kt k2");
  const bar = h("div", "kt-bar");
  const ten = h("div", "kt-ten", String(act ? (act.title || "") : ""));
  const phai = h("div", "kt-phai");
  const so = h("div", "kt-dongho"); so.hidden = true;
  phai.append(so);
  bar.append(ten, phai);
  const than = h("div", "kt-than");
  k.append(bar, than);
  app.append(k);
  khung = { k, bar, ten, so, than };
  return khung;
}
function thongBao(tieuDe, phu, nutThuLai) {
  if (!khung) dungKhung(null);
  khung.than.innerHTML = "";
  const c = h("div", "kt-giua");
  c.append(h("div", "kt-to", tieuDe));
  if (phu) c.append(h("div", "kt-phu", phu));
  if (nutThuLai) c.append(nut("THỬ LẠI", "kt-chinh", () => location.reload()));
  khung.than.append(c);
}

// ================= KHỞI ĐỘNG =================
Promise.resolve().then(start);
async function start() {
  flushOutbox().catch(() => {});
  dungKhung(null);
  if (!CODE) return thongBao("Đường link chưa đủ", "Em hãy mở bài từ trang kiemtra.andrewclasses.com.");
  thongBao("Đang tải bài...", "");
  let a = null;
  const thu = THU_MAY && window.__KT_THU;   // bàn thử trên máy: scratch/kiemtra2-thu.html đặt sẵn bài giả
  try { a = thu ? JSON.parse(JSON.stringify(thu)) : await getAssignment(CODE); }
  catch (e) { return thongBao("Không có kết nối mạng", "Em kiểm tra mạng rồi bấm Thử lại.", true); }
  if (!a || !a.activity || a.trashed) return thongBao("Không tìm thấy bài", "Em báo thầy Andrew nhé.");
  if (a.closed) return thongBao("Bài này đã đóng", "Em báo thầy Andrew nhé.");
  const act = a.activity;
  const kt = (act.content && act.content.kiemTra) || {};
  const ds = cauTuAct(act, kt);
  if (!ds.length) return thongBao("Bài chưa có câu hỏi", "Em báo thầy Andrew nhé.");
  document.title = (act.title || "Kiểm tra") + " — Andrew Classes";
  dungKhung(act);
  if (MA) sanVe(MA);
  // tải trước hình (câu có hình hiện ngay, không nháy trống giữa giờ)
  ds.concat(cauThu(kt, act)).forEach(c => { if (c.hinh) { const i = new Image(); i.src = hinhUrl(c.hinh); } });

  let xong = false;
  try { xong = localStorage.getItem(KHOA_XONG) === "1"; } catch (e) { /* thôi */ }
  if (!xong && MA && !thu) {
    try {
      const sc = await listScores(CODE, 200, MA);
      xong = sc.some(r => r && String(r.ma || "").toUpperCase() === MA.toUpperCase() && !r.doDang);
    } catch (e) { /* không đọc được: coi như chưa */ }
  }
  if (xong) { baoMe("xong"); manXong({ daNopTruoc: true }); guiBuBaiNop(); return; }

  const luu = docLuu();
  if (luu && luu.pha && Array.isArray(luu.ds) && luu.ds.length === ds.length) {
    baoMe("dang-lam");
    luu.taiLai = (luu.taiLai || 0) + 1;
    if (luu.pha === "lam") return lamBai(act, kt, ds, luu);
    if (luu.pha === "phim") return xemPhim(act, kt, ds, luu);
  }
  baoMe("chua");
  manReady(act, kt, ds);
}

// ================= READY + HƯỚNG DẪN =================
const LOI_CHUNG = [
  "Mỗi câu có thời gian riêng — thanh màu dưới câu hỏi ngắn dần. Hết giờ máy TỰ sang câu sau.",
  "Mỗi câu chỉ làm một lần, không quay lại được. Bài không báo đúng hay sai — em cứ làm hết sức mình.",
  "Em tự làm, không hỏi người khác, không dùng phần mềm dịch."
];
let mocHd = 0, hdMs = 0, thuSai = 0, thuMs = 0, thuHet = 0;
function manReady(act, kt, ds) {
  const { than } = khung;
  than.innerHTML = "";
  const c = h("div", "kt-giua kt-ready");
  c.append(h("div", "kt-nhan", "BÀI KIỂM TRA" + (kt.phan ? " · PHẦN " + kt.phan : "")));
  c.append(h("div", "kt-to", act.title || ""));
  const gMin = Math.min(...ds.map(x => x.giay)), gMax = Math.max(...ds.map(x => x.giay));
  c.append(h("div", "kt-phu", `${ds.length} câu · mỗi câu ${gMin === gMax ? gMin : gMin + "–" + gMax} giây`));
  if (TEN) c.append(h("div", "kt-chao", `Chào ${TEN}!`));
  c.append(nut("READY", "kt-chinh kt-lon", () => { mocHd = Date.now(); huongDan(act, kt, ds); }));
  than.append(c);
}
function huongDan(act, kt, ds) {
  const { than } = khung;
  than.innerHTML = "";
  const c = h("div", "kt-intro k2-hd");
  c.append(h("div", "kt-nhan", "HƯỚNG DẪN"));
  c.append(h("div", "kt-de", kt.de || "Làm bài theo hướng dẫn."));
  if (kt.viDu) c.append(viDu(kt.viDu));
  const dan = h("ul", "kt-dan");
  (Array.isArray(kt.dan) && kt.dan.length ? kt.dan : LOI_CHUNG).forEach((x, i) => {
    const li = h("li", "", x); dan.append(li);
    setTimeout(() => li.classList.add("hien"), 150 + i * 450);
  });
  c.append(dan);
  const chan = h("div", "kt-chan");
  const thu = cauThu(kt, act);
  if (kt.loai === "tri-nho") chan.append(nut("XEM PHIM ›", "kt-chinh kt-lon", () => { ghiHd(); xemPhim(act, kt, ds, null); }));
  else if (thu.length) chan.append(nut("LÀM THỬ ›", "kt-chinh", () => { ghiHd(); lamThu(act, kt, ds, thu); }));
  else chan.append(nut("BẮT ĐẦU LÀM BÀI", "kt-chinh kt-lon", () => { ghiHd(); lamBai(act, kt, ds, null); }));
  c.append(chan);
  than.append(c);
}
function ghiHd() { if (mocHd) { hdMs += Date.now() - mocHd; mocHd = 0; } }
// thẻ ví dụ: { trai: "con voi" | hinh, phai: "an elephant" }
function viDu(v) {
  const the = h("div", "kt-vidu hien xong k2-vidu");
  const trai = h("div", "kt-vidu-trai");
  if (v.hinh) trai.append(anh(v.hinh, "k2-hinh-nho"));
  if (v.trai) trai.append(h("div", "kt-vidu-viet", v.trai));
  if (v.ghi) trai.append(h("div", "kt-vidu-ghi hien", v.ghi));
  const o = h("div", "kt-vidu-o", v.phai || "");
  the.append(trai, h("div", "kt-vidu-mui", "→"), o);
  return the;
}

// ================= THANH THỜI GIAN =================
// mốc HẾT GIỜ theo giờ thật (Date.now) ⇒ tải lại trang không được thêm giờ. onHet gọi đúng MỘT lần.
function thanhGio(cha, het, giay, onHet) {
  const vach = h("div", "k2-gio");
  const ruot = h("i");
  const so = h("span", "k2-gio-so");
  vach.append(ruot, so);
  cha.append(vach);
  let xong = false, id = 0;
  function ve() {
    if (xong) return;
    const con = het - Date.now();
    const tl = Math.max(0, Math.min(1, con / (giay * 1000)));
    ruot.style.width = (tl * 100).toFixed(2) + "%";
    vach.classList.toggle("cam", tl <= 1 / 3);
    so.textContent = Math.max(0, Math.ceil(con / 1000)) + "s";
    if (con <= 0) { xong = true; clearInterval(id); onHet(); }
  }
  id = setInterval(ve, 100);
  ve();
  return { dung() { xong = true; clearInterval(id); } };
}

// ================= Ô GÕ (chép từ kiemtra.js — giữ y nguyên các chữa lỗi bàn phím Đợt 419/471) =================
let demDan = null, demPhim = null;
function taoO() {
  const dong = h("div", "kt-o-dong");
  const inp = h("input", "kt-o");
  inp.type = "text";
  inp.autocomplete = "off"; inp.spellcheck = false;
  inp.setAttribute("autocorrect", "off"); inp.setAttribute("autocapitalize", "off");
  inp.setAttribute("enterkeyhint", "next");
  inp.maxLength = 200;
  dong.append(inp);
  const o = { dong, inp, onEnter: null, ghep: 0, giaTri: () => { loc(); return inp.value; } };
  let dangGhep = false, choEnter = 0, lanGo = 0;
  inp.addEventListener("keydown", e => { if (e.key !== "Enter" && e.keyCode !== 13) lanGo = performance.now(); }, true);
  inp.addEventListener("input", () => { lanGo = performance.now(); }, true);
  o.choYen = () => new Promise(xong => {
    const bd = performance.now();
    (function doi() {
      const t = performance.now();
      if ((!dangGhep && t - lanGo >= 250) || t - bd >= 1000) xong(o.giaTri()); else setTimeout(doi, 50);
    })();
  });
  const banEnter = () => { clearTimeout(choEnter); choEnter = 0; o.onEnter && o.onEnter(); };
  const chanSk = e => { e.preventDefault(); if (demDan && (e.type === "paste" || e.type === "drop" || e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop")) demDan(); };
  ["paste", "copy", "cut", "drop", "dragstart", "contextmenu"].forEach(t => inp.addEventListener(t, chanSk));
  inp.addEventListener("beforeinput", e => { if (/^insertFrom(Paste|Drop|Yank)$/.test(e.inputType || "")) chanSk(e); });
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.keyCode === 13) {
      if (e.isComposing || e.keyCode === 229 || dangGhep) { o.ghep++; clearTimeout(choEnter); choEnter = setTimeout(banEnter, 400); return; }
      e.preventDefault();
      clearTimeout(choEnter); choEnter = setTimeout(banEnter, 0);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && /^[vxc]$/i.test(e.key)) { e.preventDefault(); if (/v/i.test(e.key) && demDan) demDan(); return; }
    if (demPhim && (e.key.length === 1 || e.key === "Backspace")) demPhim();
  });
  const loc = () => {
    const v = inp.value, s = v.replace(/[^\x20-\x7E]/g, "");
    if (s !== v) { const p = Math.max(0, (inp.selectionStart ?? s.length) - (v.length - s.length)); inp.value = s; inp.setSelectionRange(p, p); }
  };
  inp.addEventListener("compositionstart", () => { dangGhep = true; });
  inp.addEventListener("input", e => { if (!e.isComposing && !dangGhep) loc(); });
  inp.addEventListener("compositionend", () => {
    dangGhep = false; loc();
    if (choEnter) { clearTimeout(choEnter); choEnter = setTimeout(banEnter, 0); }
  });
  const chen = ch => {
    const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
    inp.value = inp.value.slice(0, a) + ch + inp.value.slice(b); lanGo = performance.now();
    inp.setSelectionRange(a + ch.length, a + ch.length);
  };
  const xoa = () => {
    const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
    lanGo = performance.now();
    if (a === b) { if (!a) return; inp.value = inp.value.slice(0, a - 1) + inp.value.slice(b); inp.setSelectionRange(a - 1, a - 1); }
    else { inp.value = inp.value.slice(0, a) + inp.value.slice(b); inp.setSelectionRange(a, a); }
  };
  try { guardVnTyping({ accepts: e => e.target === inp && !inp.disabled, insert: chen, backspace: xoa, input: inp, afterSet: () => {} }); }
  catch (e) { /* bộ gõ: chỉ là lưới đỡ */ }
  return o;
}

// ================= DỰNG MỘT CÂU (dùng chung làm thử + bài thật) =================
// Trả { k (khối câu), o (ô gõ nếu có), nuts (các ô chọn) }. onChon(index) cho câu chọn.
function dungCau(c, { nhan, onChon }) {
  const k = h("div", "kt-cau k2-cau");
  if (nhan) k.append(h("div", "kt-nhan", nhan));
  const vung = h("div", "k2-vung");
  if (c.so && c.hinh) {   // số ít → số nhiều: [1 hình + "one rabbit"]  [n hình + "two ____"]
    const hai = h("div", "k2-hai");
    const t = h("div", "k2-o-hinh");
    t.append(h("div", "k2-hang", ""));
    t.firstChild.append(anh(c.hinh));
    t.append(h("div", "k2-chu", "one " + (c.mot || "")));
    const p = h("div", "k2-o-hinh");
    const hang = h("div", "k2-hang nhieu" + (c.so >= 4 ? " bon" : ""));
    for (let i = 0; i < c.so; i++) hang.append(anh(c.hinh));
    p.append(hang);
    p.append(h("div", "k2-chu", (SO_CHU[c.so] || String(c.so)) + " ____"));
    hai.append(t, h("div", "k2-mui", "→"), p);
    vung.append(hai);
  } else {
    if (c.hinh) { const o = h("div", "k2-o-hinh mot"); o.append(anh(c.hinh)); vung.append(o); }
    vung.append(h("div", "kt-de-cau" + (c.hinh ? " k2-de-nho" : ""), c.de));
  }
  k.append(vung);
  const r = { k, o: null, nuts: [] };
  if (c.kieu === "chon") {
    const luoi = h("div", "k2-chon" + (c.chon.length === 2 ? " hai" : c.chon.length === 3 ? " ba" : ""));
    c.chon.forEach((txt, i) => {
      const b = nut(txt, "k2-o-chon", () => onChon && onChon(i, b));
      luoi.append(b); r.nuts.push(b);
    });
    k.append(luoi);
  } else {
    r.o = taoO();
    k.append(r.o.dong);
  }
  return r;
}
const SO_CHU = { 2: "two", 3: "three", 4: "four", 5: "five" };

// ================= LÀM THỬ =================
function lamThu(act, kt, ds, thu) {
  const { than } = khung;
  const bd = Date.now();
  let i = 0;
  function ve() {
    than.innerHTML = "";
    const c = thu[i];
    let daXong = false, gio = null;
    const r = dungCau(c, { nhan: `LÀM THỬ ${i + 1}/${thu.length} · không tính điểm`, onChon: (j, b) => cham(j, b) });
    const bao = h("div", "kt-bao");
    const nuts = h("div", "kt-nuts");
    let kiem = null;
    if (c.kieu === "go") { kiem = nut("KIỂM TRA", "kt-chinh", () => setTimeout(() => cham(), 0)); nuts.append(kiem); r.o.onEnter = () => cham(); }
    r.k.insertBefore(h("div", "k2-gio-cho"), r.k.children[1] || null);
    r.k.append(bao, nuts);
    than.append(r.k);
    gio = thanhGio(r.k.querySelector(".k2-gio-cho"), Date.now() + c.giay * 1000, c.giay, () => {
      if (daXong) return;
      thuHet++;
      r.nuts.forEach(x => { x.disabled = true; });
      if (r.o) r.o.inp.disabled = true;
      bao.className = "kt-bao sai";
      bao.innerHTML = "";
      bao.append(h("div", "kt-bao-dau", "Hết giờ rồi! Bài thật sẽ tự sang câu sau khi hết giờ."),
        h("div", "kt-bao-hd", (c.huongDan ? c.huongDan + " " : "") + "Em thử lại nhanh hơn nhé."));
      nuts.innerHTML = "";
      nuts.append(nut("THỬ LẠI CÂU NÀY", "kt-chinh", () => ve()));
    });
    if (r.o) r.o.inp.focus();
    async function cham(j, b) {
      if (daXong) { tiep(); return; }
      let ok;
      if (c.kieu === "chon") { ok = j === c.dapDung; r.nuts.forEach(x => x.classList.remove("chon")); b.classList.add("chon"); }
      else { const v = await r.o.choYen(); if (!v.trim()) { r.o.inp.focus(); return; } ok = dung(v, c.dap); }
      if (ok) {
        daXong = true; gio.dung();
        bao.className = "kt-bao dung"; bao.textContent = "Đúng rồi! 🎉";
        if (c.kieu === "chon") { b.classList.add("dung"); r.nuts.forEach(x => { x.disabled = true; }); }
        else { r.o.inp.classList.add("dung"); r.o.inp.disabled = true; }
        nuts.innerHTML = "";
        const t = nut(i < thu.length - 1 ? "CÂU TIẾP ›" : "XONG ›", "kt-chinh", tiep);
        nuts.append(t); t.focus();
      } else {
        thuSai++;
        bao.className = "kt-bao sai"; bao.innerHTML = "";
        bao.append(h("div", "kt-bao-dau", "Chưa đúng rồi."), h("div", "kt-bao-hd", c.huongDan || ""));
        if (r.o) { r.o.inp.classList.add("sai"); setTimeout(() => r.o.inp.classList.remove("sai"), 600); r.o.inp.focus(); r.o.inp.select(); }
      }
    }
    function tiep() { i++; if (i < thu.length) ve(); else xongThu(); }
  }
  function xongThu() {
    thuMs += Date.now() - bd;
    than.innerHTML = "";
    const c = h("div", "kt-giua");
    c.append(h("div", "kt-nhan", "SẴN SÀNG CHƯA?"));
    c.append(h("div", "kt-to", "Em đã làm xong phần thử!"));
    c.append(h("div", "kt-phu", `Bài thật có ${ds.length} câu. Hết giờ máy tự sang câu sau, không báo đúng sai và không quay lại được.`));
    const nuts = h("div", "kt-nuts");
    nuts.append(nut("Làm thử lại", "kt-phu-btn", () => lamThu(act, kt, ds, thu)));
    nuts.append(nut("BẮT ĐẦU LÀM BÀI", "kt-chinh kt-lon", () => lamBai(act, kt, ds, null)));
    c.append(nuts);
    than.append(c);
  }
  ve();
}

// ================= PHIM (phần trí nhớ) =================
// Xem trong khung, KHÔNG có nút tua/dừng. Em rời trang ⇒ phim TỰ DỪNG (ghi lại), quay về ⇒ chạy tiếp.
// Tải lại trang giữa phim ⇒ chạy lại từ đầu CẢNH đang xem (s.canh), không cho xem lại từ đầu cả phim.
function moiTrangThai(ds) {
  return {
    pha: "lam", i: 0, het: 0, daMs: 0,
    ds: ds.map(() => ({ typed: "", chon: -1, ms: 0, anMs: 0, roi: 0, mat: 0, matMs: 0, dan: 0, phim: 0, xong: false, hetGio: false })),
    taiLai: 0, hdMs: 0, thuSai: 0, thuMs: 0, thuHet: 0, luot: newPlayLogId(), luotTao: gioChuan(), bd: Date.now(),
    phim: null
  };
}
function chepThu(s) { s.hdMs = hdMs; s.thuSai = thuSai; s.thuMs = thuMs; s.thuHet = thuHet; }
async function xemPhim(act, kt, ds, s) {
  if (!s) { s = moiTrangThai(ds); chepThu(s); s.pha = "phim"; s.phim = { canh: 0, ms: 0, roi: 0, anMs: 0, taiLai: 0, xong: false }; }
  else if (s.phim) s.phim.taiLai = (s.phim.taiLai || 0) + 1;
  ghiLuu(s);
  const { than } = khung;
  than.innerHTML = "";
  const c = h("div", "k2-phim-khung");
  const san = h("div", "k2-phim-san");
  const che = h("div", "k2-phim-che");
  c.append(san, che);
  than.append(c);
  const duong = String(kt.phim || "");
  if (!/^kiemtra2\/[a-z0-9/_-]+\.js$/.test(duong)) return thongBao("Phim chưa sẵn sàng", "Em báo thầy Andrew nhé.");
  let P = null;
  try { P = await import(new URL(duong, import.meta.url).href); }
  catch (e) { return thongBao("Không tải được phim", "Em kiểm tra mạng rồi bấm Thử lại.", true); }
  const tu = Math.max(0, Math.min((P.SO_CANH || 12) - 1, +s.phim.canh || 0));
  let ph = null, chay = false, bdDoan = 0, anTu = 0;
  const ketThuc = () => {
    if (chay) { s.phim.ms += Date.now() - bdDoan; chay = false; }
    s.phim.xong = true;
    document.removeEventListener("visibilitychange", onVis);
    try { ph && ph.huy(); } catch (e) { /* thôi */ }
    s.pha = "lam"; s.i = 0; s.het = 0;
    ghiLuu(s);
    sauPhim();
  };
  ph = P.taoPhim(san, {
    tu,
    onCanh: i => { s.phim.canh = i; ghiLuu(s); },
    onXong: ketThuc
  });
  const onVis = () => {
    if (!chay && !anTu && document.visibilityState === "visible") return;
    if (document.visibilityState === "hidden") {
      if (chay) { try { ph.dung(); } catch (e) { /* thôi */ } s.phim.ms += Date.now() - bdDoan; chay = false; }
      if (!anTu) { anTu = Date.now(); s.phim.roi++; ghiLuu(s); }
    } else if (anTu) {
      s.phim.anMs += Date.now() - anTu; anTu = 0;
      if (che.hidden) { try { ph.tiep(); } catch (e) { /* thôi */ } bdDoan = Date.now(); chay = true; }
      ghiLuu(s);
    }
  };
  // màn che: nút XEM PHIM (âm thanh chỉ chạy được sau một cú bấm của em)
  che.innerHTML = "";
  const hop = h("div", "k2-phim-hop");
  hop.append(h("div", "kt-to", tu ? "Xem tiếp phim" : "Hãy xem thật kỹ!"));
  hop.append(h("div", "kt-phu", tu ? "Phim chạy tiếp từ cảnh em đang xem." : "Phim chỉ chiếu MỘT lần, không tua được. Xem xong sẽ có câu hỏi về phim."));
  const b = nut("▶ XEM PHIM", "kt-chinh kt-lon", async () => {
    b.disabled = true; b.textContent = "Đang tải phim...";
    // ⛔ gọi chay() NGAY trong cú bấm (nó tự đợi tải xong): await trước đó thì trên điện thoại mạng chậm,
    //    quá ~5 s trình duyệt hết "lượt cho phép phát tiếng" ⇒ phim câm.
    let p0 = null;
    try { p0 = ph.chay(); } catch (e) { return ketThuc(); }
    try { await Promise.race([p0, cho(20000)]); } catch (e) { /* vẫn xem tiếp */ }
    che.hidden = true;
    document.addEventListener("visibilitychange", onVis);
    bdDoan = Date.now(); chay = true;
  });
  hop.append(b);
  che.append(hop);

  function sauPhim() {
    than.innerHTML = "";
    const g = h("div", "kt-giua");
    g.append(h("div", "kt-nhan", "PHIM ĐÃ HẾT"));
    g.append(h("div", "kt-to", "Bây giờ là câu hỏi!"));
    g.append(h("div", "kt-phu", `${ds.length} câu hỏi về phim, mỗi câu ${ds[0].giay} giây. Chọn đáp án đúng nhé.`));
    g.append(nut("BẮT ĐẦU", "kt-chinh kt-lon", () => lamBai(act, kt, ds, s)));
    than.append(g);
  }
}

// ================= BÀI THẬT =================
// ⭐ 11/10/2026 (thầy) — XÁO thứ tự câu RIÊNG cho từng em (kiemTra.xao: phần a/an, số nhiều): thứ tự lưu trong tiến độ (tải lại
//   không đổi), bài làm gửi kho vẫn theo THỨ TỰ GỐC (dashboard đối chiếu đáp án theo số câu) + `viTri` = câu thứ mấy em thấy.
//   Tránh chuỗi 4 câu liền cùng đáp án (a, a, a, a…) để em không đoán theo nhịp.
function xaoThuTu(ds) {
  const n = ds.length, rnd = k => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % k; };
  let tot = null;
  for (let lan = 0; lan < 60; lan++) {
    const t = ds.map((_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = rnd(i + 1); [t[i], t[j]] = [t[j], t[i]]; }
    let chuoi = 1, dai = 1;
    for (let i = 1; i < n; i++) { chuoi = ds[t[i]].dapDung === ds[t[i - 1]].dapDung && ds[t[i]].kieu === "chon" ? chuoi + 1 : 1; dai = Math.max(dai, chuoi); }
    tot = t;
    if (dai < 4) break;
  }
  return tot;
}
function lamBai(act, kt, ds, s) {
  if (!s) { s = moiTrangThai(ds); chepThu(s); }
  const goc = ds;
  if (kt.xao && !(Array.isArray(s.thuTu) && s.thuTu.length === goc.length)) s.thuTu = xaoThuTu(goc);
  if (Array.isArray(s.thuTu) && s.thuTu.length === goc.length) ds = s.thuTu.map(k => goc[k]);
  const dungReview = (d, st, opt) => dungReviewGoc(d, st, opt);
  s.pha = "lam";
  const { than, so } = khung;
  so.hidden = false;
  let anTu = 0, matTu = 0, daNop = false, gio = null, cauMoc = Date.now(), r = null, dangChuyen = false;
  const tongMs = () => Date.now() - (s.bd || Date.now());
  const cau = () => s.ds[s.i];

  const log = () => ({ code: CODE, id: s.luot, name: TEN || "Học sinh", ma: MA, mode: "submit", again: false, mistakes: false,
    score: 0, total: ds.length, timeMs: tongMs(), done: false, attemptId: "", createdAt: s.luotTao, activeMs: tongMs(),
    review: s.ds.some(c => c.xong) ? dungReview(ds, s, { doDang: true }) : undefined });
  if (!THU_MAY || !window.__KT_THU) beatPlayLog(log()).catch(() => {});
  const nhip = setInterval(() => { if (!daNop) { luu(); if (!window.__KT_THU) beatPlayLog(log()).catch(() => {}); } }, 60000);

  const onVis = () => {
    if (daNop) return;
    if (document.visibilityState === "hidden") { if (!anTu) { anTu = Date.now(); cau().roi++; } }
    else if (anTu) { cau().anMs += Date.now() - anTu; anTu = 0; luu(); }
  };
  const onBlur = () => { if (!daNop && !matTu) { matTu = Date.now(); cau().mat++; } };
  const onFocus = () => { if (matTu) { cau().matMs += Date.now() - matTu; matTu = 0; } };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  const onHide = () => { if (daNop) return; if (r && r.o) cau().nhap = r.o.inp.value; guiLuotDo(true); luu(); if (!window.__KT_THU) beatPlayLog(log(), { keepalive: true }); };
  window.addEventListener("pagehide", onHide);
  demDan = () => { cau().dan++; nhacDan(); };
  demPhim = () => { cau().phim++; };

  function luu() { if (!daNop) ghiLuu(s); }
  function guiLuotDo(gap) {
    if (window.__KT_THU) return;
    const daLam = s.ds.filter(c => c.xong).length;
    if (!daLam) return;
    const dau = `${s.luot}|${daLam}`;
    if (s.doGui === dau) return;
    s.doGui = dau;
    const review = dungReview(ds, s, { doDang: true });
    const args = { code: CODE, studentName: TEN || "Học sinh", ma: MA, score: review.filter(x => x.yourCorrect).length,
      total: ds.length, timeMs: tongMs(), review, doDang: true };
    try { if (gap) queueAttemptKeepalive(args); else sendAttempt(queueAttempt(args)).catch(() => {}); } catch (e) { /* bài vẫn trên máy */ }
  }
  function chotGio() {
    const c = cau(), t = Date.now();
    c.ms += t - cauMoc; cauMoc = t;
    if (anTu) { c.anMs += t - anTu; anTu = 0; }
    if (matTu) { c.matMs += t - matTu; matTu = 0; }
  }
  let nhacEl = null;
  function nhacDan() {
    if (!nhacEl) return;
    nhacEl.textContent = "Bài kiểm tra không cho dán chữ — em hãy tự gõ nhé.";
    nhacEl.classList.add("hien");
    clearTimeout(nhacDan.t); nhacDan.t = setTimeout(() => nhacEl && nhacEl.classList.remove("hien"), 2500);
  }

  function ve() {
    const c = ds[s.i], st = cau();
    // mốc hết giờ: câu mới ⇒ đặt; tải lại trang ⇒ giữ mốc cũ (không được thêm giờ)
    if (!s.het || s.hetCau !== s.i) { s.het = Date.now() + c.giay * 1000; s.hetCau = s.i; }
    cauMoc = Date.now();
    so.textContent = `${s.i + 1}/${ds.length}`;
    than.innerHTML = "";
    dangChuyen = false; choHet = false;
    r = dungCau(c, { nhan: `CÂU ${s.i + 1}/${ds.length}`, onChon: (j, b) => chon(j, b) });
    const gioCho = h("div", "k2-gio-cho");
    r.k.insertBefore(gioCho, r.k.children[1] || null);
    nhacEl = h("div", "kt-nhac");
    if (r.o) {
      r.o.inp.value = st.nhap || "";
      r.o.inp.addEventListener("input", () => { st.nhap = r.o.inp.value; });
      r.k.append(nhacEl);
      const nuts = h("div", "kt-nuts");
      nuts.append(nut(laCuoi() ? "NỘP BÀI" : "TIẾP ›", "kt-chinh", () => setTimeout(() => traLoi(false), 0)));
      r.k.append(nuts);
      r.o.onEnter = () => traLoi(false);
    }
    than.append(r.k);
    if (r.o) r.o.inp.focus();
    gio = thanhGio(gioCho, s.het, c.giay, () => traLoi(true));
    luu();
  }
  const laCuoi = () => s.i === ds.length - 1;

  async function chon(j, b) {
    if (daNop || dangChuyen) return;
    dangChuyen = true;
    gio && gio.dung();
    chotGio();
    const st = cau();
    st.chon = j; st.typed = ds[s.i].chon[j]; st.xong = true;
    b.classList.add("chon");
    r.nuts.forEach(x => { x.disabled = true; });
    luu();
    await cho(260);
    sangCau();
  }
  let choHet = false;   // hết giờ đúng lúc đang đợi ô gõ "đứng yên" (Enter vừa bấm)
  async function traLoi(hetGio) {
    if (daNop) return;
    if (dangChuyen) { if (hetGio) choHet = true; return; }
    const c = ds[s.i], st = cau();
    if (c.kieu === "chon") {   // hết giờ câu chọn ⇒ bỏ trống
      dangChuyen = true; gio && gio.dung(); chotGio();
      st.xong = true; st.hetGio = true; st.chon = -1; st.typed = "";
      luu(); return sangCau();
    }
    const oCu = r.o;
    if (!hetGio) {
      dangChuyen = true;
      await oCu.choYen();
      if (daNop) return;
      const v0 = oCu.giaTri().trim();
      if (!v0 && !choHet) { dangChuyen = false; oCu.inp.focus(); return; }   // chưa gõ gì: Enter không tính (đợi em gõ hoặc hết giờ)
      if (!v0) hetGio = true;
    }
    dangChuyen = true;
    gio && gio.dung();
    chotGio();
    const v = oCu.giaTri().trim().replace(/\s+/g, " ");
    if (oCu.ghep) { st.ghep = (st.ghep || 0) + oCu.ghep; oCu.ghep = 0; }
    st.typed = v; st.xong = true; st.hetGio = !!hetGio; st.nhap = "";
    oCu.inp.disabled = true;
    // nửa giây sau đọc lại ô cũ: chữ cuối tới muộn (bộ gõ) mà nối tiếp đúng ⇒ bổ sung (khuôn Đợt 471)
    if (v && !hetGio) setTimeout(() => {
      const v2 = oCu.giaTri().trim().replace(/\s+/g, " ");
      if (v2 !== v && v2.startsWith(v) && st.typed === v) { st.typed = v2; st.tre = (st.tre || 0) + 1; luu(); }
    }, 500);
    luu();
    if (hetGio) { await cho(350); }
    sangCau();
  }
  function sangCau() {
    if (daNop) return;
    if (s.i < ds.length - 1) { s.i++; s.het = 0; return ve(); }
    nop();
  }

  async function nop() {
    if (daNop) return;
    daNop = true;
    gio && gio.dung();
    const timeMs = tongMs();
    clearInterval(nhip);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus);
    window.removeEventListener("pagehide", onHide);
    demDan = null; demPhim = null;
    so.hidden = true;
    await cho(600);   // chữ tới muộn ở câu cuối kịp bổ sung
    const review = dungReview(ds, s, {});
    const score = review.filter(x => x.yourCorrect).length;
    thongBao("Đang nộp bài...", "Em chờ một chút nhé.");
    if (window.__KT_THU) { window.__KT_NOP = { score, total: ds.length, timeMs, review }; xoaLuu(); baoMe("xong"); return manXong({}); }
    const entry = queueAttempt({ code: CODE, studentName: TEN || "Học sinh", ma: MA, score, total: ds.length, timeMs, review });
    try { localStorage.setItem(KHOA_XONG, "1"); } catch (e) { /* thôi */ }
    xoaLuu();
    const ghiLog = () => beatPlayLog({ ...log(), timeMs, activeMs: timeMs, done: true, attemptId: entry.attemptId, review }).catch(() => {});
    let kq = await sendAttempt(entry).catch(() => ({ ok: false }));
    if (kq && kq.ok) {
      ghiLog(); baoMe("xong");
      try { window.parent !== window && window.parent.postMessage({ type: "AWORD:NOP", code: CODE, name: TEN }, "*"); } catch (e) { /* thôi */ }
      return manXong({});
    }
    const thuLai = async () => {
      thongBao("Đang nộp lại...", "");
      kq = await sendAttempt(entry).catch(() => ({ ok: false }));
      if (kq && kq.ok) { ghiLog(); baoMe("xong"); return manXong({}); }
      loi();
    };
    const loi = () => {
      khung.than.innerHTML = "";
      const c = h("div", "kt-giua");
      c.append(h("div", "kt-to", "Chưa nộp được bài"));
      c.append(h("div", "kt-phu", kq && kq.canVe
        ? "Em hãy mở bài từ trang kiemtra.andrewclasses.com (đã đăng nhập) rồi bấm Nộp lại. Bài làm của em vẫn được giữ trên máy."
        : "Mạng đang có vấn đề. Bài làm của em vẫn được giữ trên máy — em bấm Nộp lại nhé."));
      c.append(nut("NỘP LẠI", "kt-chinh", thuLai));
      khung.than.append(c);
    };
    loi();
  }

  baoMe("dang-lam");
  // Tải lại trang: câu đang làm đã HẾT GIỜ trong lúc trang đóng ⇒ ghi bỏ trống/chữ đang gõ rồi sang câu sau (lần lượt)
  while (s.het && s.hetCau === s.i && Date.now() >= s.het && s.i < ds.length) {
    const st = cau(), c = ds[s.i];
    st.xong = true; st.hetGio = true;
    if (c.kieu === "go") { st.typed = String(st.nhap || "").trim().replace(/\s+/g, " "); st.nhap = ""; }
    else { st.chon = -1; st.typed = ""; }
    st.ms += Math.max(0, c.giay * 1000 - st.ms);
    if (s.i >= ds.length - 1) { s.het = 0; luu(); return nop(); }
    s.i++;
    s.het = 0;   // câu kế tiếp bắt đầu tính giờ từ BÂY GIỜ
  }
  ve();
}

// ---------- bài làm gửi kho ----------
// thứ tự đã xáo ⇒ trả về theo THỨ TỰ GỐC của act (+ viTri = câu thứ mấy em thấy), `kt` luôn ở hàng đầu
function dungReviewGoc(ds, s, opt) {
  const r = dungReview(ds, s, opt);
  if (!Array.isArray(s.thuTu) || s.thuTu.length !== r.length) return r;
  const kt = r[0].kt; delete r[0].kt;
  const ra = [];
  s.thuTu.forEach((k, pos) => { ra[k] = Object.assign(r[pos], { viTri: pos + 1 }); });
  ra[0].kt = Object.assign(kt, { xao: true });
  return ra;
}
function dungReview(ds, s, { doDang = false } = {}) {
  const review = ds.map((c, i) => {
    const st = s.ds[i];
    const yourText = st.typed || "";
    const yourCorrect = c.kieu === "chon" ? st.chon === c.dapDung && st.chon >= 0 : dung(yourText, c.dap);
    const de = c.so && c.mot ? `one ${c.mot} → ${SO_CHU[c.so] || c.so} ____` : c.de;
    return {
      question: de, answered: !!yourText, yourText, yourCorrect,
      correctText: c.kieu === "chon" ? c.chon[c.dapDung] : c.dap[0],
      ms: Math.round(st.ms), giay: c.giay, ...(st.hetGio ? { hetGio: true } : {}),
      anMs: Math.round(st.anMs), roi: st.roi, mat: st.mat, matMs: Math.round(st.matMs), dan: st.dan, phim: st.phim,
      boQua: !yourText, ...(c.kieu === "chon" ? { chon: st.chon } : {}), ...(c.hinh ? { hinh: c.hinh } : {}),
      ...(st.ghep ? { ghep: st.ghep } : {}), ...(st.tre ? { tre: st.tre } : {})
    };
  });
  review[0].kt = {
    bo: "B", taiLai: s.taiLai || 0, gioiThieuMs: Math.round(s.hdMs || 0), thuSai: s.thuSai || 0, thuMs: Math.round(s.thuMs || 0), thuHet: s.thuHet || 0,
    hetGio: s.ds.filter(x => x.hetGio).length, may: thietBi(),
    ...(s.phim ? { phim: { ms: Math.round(s.phim.ms || 0), roi: s.phim.roi || 0, anMs: Math.round(s.phim.anMs || 0), taiLai: s.phim.taiLai || 0, xong: !!s.phim.xong } } : {}),
    luotSo: 1, ...(doDang ? { doDang: true, dangCau: s.i + 1 } : {}), phienBan: 3
  };
  return review;
}
async function guiBuBaiNop() {
  let ds = [];
  try { ds = JSON.parse(localStorage.getItem("aword-hw-outbox") || "[]") || []; } catch (e) { return; }
  for (const e of ds.filter(x => x && x.code === CODE && !x.doDang)) {
    try { await sendAttempt(e); } catch (er) { /* lần sau */ }
  }
}

// ================= XONG =================
function manXong({ daNopTruoc = false } = {}) {
  khung.so.hidden = true;
  const { than } = khung;
  than.innerHTML = "";
  const c = h("div", "kt-giua kt-xong");
  c.append(h("div", "kt-sao", "★"));
  c.append(h("div", "kt-to", daNopTruoc ? "Em đã hoàn thành phần này" : "Chúc mừng em đã hoàn thành!"));
  c.append(h("div", "kt-phu", daNopTruoc ? "Bài làm đã được gửi tới thầy Andrew." : "Bài làm đã được gửi tới thầy Andrew. Em làm tiếp phần bên dưới nhé."));
  than.append(c);
}

// Chặn sao chép đề sang phần mềm dịch
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("cut", e => e.preventDefault());
document.addEventListener("contextmenu", e => e.preventDefault());
