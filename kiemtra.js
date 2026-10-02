// =============================================================
// kiemtra.js — TRANG LÀM BÀI KIỂM TRA ĐẦU VÀO (kiemtra.html?g=<mã bài giao>&n=<tên>&ma=<ID>&nhung=1)
// Đợt 440 — thầy Andrew chốt 02/10/2026. Nhúng trong trang kiemtra.andrewclasses.com (mỗi bài một thẻ).
//
// Vì sao một TRANG RIÊNG chứ không phải một tuỳ chọn trong engine Type the answer:
//   engine (core/engine.js ~7.600 dòng) chạy cho MỌI lớp mỗi ngày; chế độ kiểm tra đổi gần như mọi thứ của nó
//   (bỏ màn đúng/sai, bỏ bảng xếp hạng, màn mở đầu + làm thử, đồng hồ từng câu, chặn dán…). Một trang riêng dùng
//   CHUNG dữ liệu (act Type the answer + bài giao + kho điểm `scores`/`results`/`practiceLog` + VÉ đăng nhập của em)
//   nhưng không chạm một dòng nào của game đang chạy.
//
// Luồng: READY → GIỚI THIỆU (phim chữ tự chạy) → LÀM THỬ (sai thì báo + hướng dẫn) → BẮT ĐẦU → làm bài thật
//        (không đúng/sai, đồng hồ đếm xuôi, ☰ Menu: tiếp tục / xem lại hướng dẫn / làm lại từ đầu) → NỘP → "Chúc mừng".
// Ghi NGẦM (vào từng hàng `review` của results — luật kho chỉ khoá các trường cấp đầu, hàng review tự do):
//   ms (thời gian làm câu), anMs/roi (rời trang: ẩn tab / chuyển ứng dụng trên điện thoại), mat/matMs (cửa sổ mất
//   tiêu điểm — alt-tab trên máy tính), dan (số lần định dán), phim (số phím gõ), boQua.
//   Hàng ĐẦU mang thêm `kt` = tóm tắt lượt (làm lại bao nhiêu lần, tải lại trang, thời gian xem hướng dẫn, làm thử sai…).
//   Mỗi lần BẮT ĐẦU / LÀM LẠI = một lượt practiceLog (done=false nếu bỏ dở) ⇒ dashboard đếm được.
// =============================================================

import {
  getAssignment, queueAttempt, sendAttempt, flushOutbox, sanVe, listScores,
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

// ---------- nội dung hướng dẫn + làm thử theo DẠNG bài (nhận theo tiêu đề act) ----------
const DANG = {
  "cum-so-it": {
    de: "Viết cụm tiếng Anh SỐ ÍT (dùng a / an) hoặc KHÔNG ĐẾM ĐƯỢC cho mỗi từ tiếng Việt.",
    viDu: [
      { viet: "cái bút", anh: "a pen", ghiChu: "Đếm được, số ít ⇒ thêm a" },
      { viet: "quả táo", anh: "an apple", ghiChu: "Bắt đầu bằng nguyên âm (a, e, i, o, u) ⇒ dùng an" },
      { viet: "nước", anh: "water", ghiChu: "Không đếm được ⇒ KHÔNG thêm a / an" }
    ],
    thu: [
      { prompt: "con mèo", acceptedAnswers: ["a cat"], huongDan: "Con mèo đếm được, chỉ có MỘT con ⇒ thêm a phía trước: a cat" },
      { prompt: "con voi", acceptedAnswers: ["an elephant"], huongDan: "elephant bắt đầu bằng nguyên âm e ⇒ dùng an: an elephant" },
      { prompt: "mật ong", acceptedAnswers: ["honey"], huongDan: "Mật ong không đếm được ⇒ không thêm a / an: honey" }
    ]
  },
  "cum-so-nhieu": {
    de: "Viết cụm tiếng Anh SỐ NHIỀU hoặc KHÔNG ĐẾM ĐƯỢC cho mỗi cụm tiếng Việt.",
    viDu: [
      { viet: "hai chiếc bút đắt tiền", anh: "two expensive pens", ghiChu: "Số đếm + tính từ + danh từ thêm s" },
      { viet: "nước nóng", anh: "hot water", ghiChu: "Không đếm được ⇒ tính từ + danh từ, không thêm s" },
      { viet: "một chiếc xe nhỏ", anh: "a small car", ghiChu: "Chỉ có MỘT ⇒ a / an + tính từ + danh từ" }
    ],
    thu: [
      { prompt: "ba con mèo đen", acceptedAnswers: ["three black cats"], huongDan: "Số nhiều: số đếm + tính từ + danh từ thêm s ⇒ three black cats (tính từ đứng TRƯỚC danh từ)" },
      { prompt: "sữa lạnh", acceptedAnswers: ["cold milk"], huongDan: "Sữa không đếm được ⇒ tính từ + danh từ, không thêm s: cold milk" },
      { prompt: "bốn quả táo đỏ", acceptedAnswers: ["four red apples"], huongDan: "Tính từ (red) không bao giờ thêm s, chỉ danh từ thêm s: four red apples" }
    ]
  },
  "tao-cau": {
    de: "Dịch mỗi câu tiếng Việt sang một câu tiếng Anh hoàn chỉnh.",
    viDu: [
      { viet: "Tôi là một học sinh", anh: "I am a student", ghiChu: "Viết đủ câu: chủ ngữ + động từ + phần còn lại" },
      { viet: "Hôm qua cô ấy đi bơi", anh: "She went swimming yesterday", ghiChu: "Để ý THỜI GIAN của câu (hôm qua ⇒ quá khứ)" }
    ],
    thu: [
      { prompt: "Tôi thích mèo", acceptedAnswers: ["I like cats"], huongDan: "Câu đơn hiện tại: I like + danh từ số nhiều chỉ chung một loài ⇒ I like cats" },
      { prompt: "Cô ấy là giáo viên", acceptedAnswers: ["She is a teacher"], huongDan: "Cần động từ to be (is) và a trước nghề nghiệp ⇒ She is a teacher" },
      { prompt: "Hôm qua tôi chơi bóng đá", acceptedAnswers: ["I played football yesterday", "Yesterday I played football", "Yesterday, I played football", "I played soccer yesterday", "Yesterday I played soccer"], huongDan: "Hôm qua ⇒ động từ ở quá khứ (play ⇒ played): I played football yesterday" }
    ]
  }
};
function dangCua(act) {
  const k = act && act.content && act.content.kiemTra && act.content.kiemTra.loai;
  if (k && DANG[k]) return DANG[k];
  const t = String((act && act.title) || "").normalize("NFC").toUpperCase();
  if (/SỐ NHIỀU|SO NHIEU/.test(t)) return DANG["cum-so-nhieu"];
  if (/SỐ ÍT|SO IT/.test(t)) return DANG["cum-so-it"];
  return DANG["tao-cau"];
}
const LOI_DAN = [
  "Bài thật KHÔNG báo đúng hay sai — em cứ làm hết sức mình.",
  "Gõ xong mỗi câu bấm Enter (hoặc nút TIẾP). Không biết thì bấm BỎ QUA.",
  "Không dùng phần mềm dịch, không hỏi người khác. Thầy cần biết em đang ở đâu để xếp lớp đúng cho em.",
  "Không giới hạn thời gian, nhưng hãy làm liền một mạch."
];

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
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
function baoMe(trangThai, them) {
  if (window.parent === window) return;
  try { window.parent.postMessage({ type: "AWORD:KT", code: CODE, trangThai, ...(them || {}) }, "*"); } catch (e) { /* trang mẹ khó tính */ }
}

// ---------- lưu tiến độ trên máy (tải lại trang không mất bài đang làm) ----------
const KHOA_LUU = `aword-kt-${CODE}-${MA || TEN}`;
const KHOA_XONG = `aword-kt-xong-${CODE}-${MA || TEN}`;
function docLuu() { try { return JSON.parse(localStorage.getItem(KHOA_LUU) || "null"); } catch (e) { return null; } }
function ghiLuu(s) { try { localStorage.setItem(KHOA_LUU, JSON.stringify(s)); } catch (e) { /* riêng tư: thôi */ } }
function xoaLuu() { try { localStorage.removeItem(KHOA_LUU); } catch (e) { /* thôi */ } }

// ---------- khung trang ----------
let khung = null;
function dungKhung(act) {
  app.innerHTML = "";
  const k = h("div", "kt");
  const bar = h("div", "kt-bar");
  const ten = h("div", "kt-ten", String(act ? (act.title || "") : ""));
  const phai = h("div", "kt-phai");
  const dongHo = h("div", "kt-dongho"); dongHo.hidden = true;
  const menu = h("button", "kt-menu"); menu.type = "button"; menu.hidden = true;
  menu.setAttribute("aria-label", "Menu");
  menu.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  phai.append(dongHo, menu);
  bar.append(ten, phai);
  const than = h("div", "kt-than");
  k.append(bar, than);
  app.append(k);
  khung = { k, bar, ten, dongHo, menu, than };
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
start();
async function start() {
  flushOutbox().catch(() => {});
  dungKhung(null);
  if (!CODE) return thongBao("Đường link chưa đủ", "Em hãy mở bài từ trang kiemtra.andrewclasses.com.");
  thongBao("Đang tải bài...", "");
  let a = null;
  // Bàn thử trên máy (chỉ localhost): scratch/kiemtra-thu.html đặt sẵn bài giả, khỏi cần bài giao thật.
  const thu = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && window.__KT_THU;
  try { a = thu ? JSON.parse(JSON.stringify(thu)) : await getAssignment(CODE); }
  catch (e) { return thongBao("Không có kết nối mạng", "Em kiểm tra mạng rồi bấm Thử lại.", true); }
  if (!a || !a.activity || a.trashed) return thongBao("Không tìm thấy bài", "Em báo thầy Andrew nhé.");
  if (a.closed) return thongBao("Bài này đã đóng", "Em báo thầy Andrew nhé.");
  const act = a.activity;
  const items = (act.content && Array.isArray(act.content.items) ? act.content.items : [])
    .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length);
  if (!items.length) return thongBao("Bài chưa có câu hỏi", "Em báo thầy Andrew nhé.");
  document.title = (act.title || "Kiểm tra") + " — Andrew Classes";
  dungKhung(act);
  if (MA) sanVe(MA);

  // Đã nộp rồi? (máy này nhớ, hoặc kho điểm có dòng của em)
  let xong = false;
  try { xong = localStorage.getItem(KHOA_XONG) === "1"; } catch (e) { /* thôi */ }
  if (!xong && MA) {
    try {
      const ds = await listScores(CODE, 200, MA);
      xong = ds.some(r => r && String(r.ma || "").toUpperCase() === MA.toUpperCase() && !r.doDang);
    } catch (e) { /* không đọc được: coi như chưa */ }
  }
  if (xong) { baoMe("xong"); return manXong(act, { daNopTruoc: true }); }

  const luu = docLuu();
  if (luu && luu.pha === "lam" && Array.isArray(luu.ds) && luu.ds.length === items.length) {
    baoMe("dang-lam");
    luu.taiLai = (luu.taiLai || 0) + 1;
    return lamBai(act, items, luu);
  }
  baoMe("chua");
  manReady(act, items);
}

// ================= READY =================
function manReady(act, items) {
  const { than } = khung;
  than.innerHTML = "";
  const c = h("div", "kt-giua kt-ready");
  c.append(h("div", "kt-nhan", "BÀI KIỂM TRA"));
  c.append(h("div", "kt-to", act.title || ""));
  c.append(h("div", "kt-phu", `${items.length} câu · không giới hạn thời gian`));
  if (TEN) c.append(h("div", "kt-chao", `Chào ${TEN}!`));
  c.append(nut("READY", "kt-chinh kt-lon", () => gioiThieu(act, items, { tuDau: true })));
  than.append(c);
}

// ================= GIỚI THIỆU (phim chữ) =================
let mocGioiThieu = 0, gioiThieuMs = 0, thuSai = 0, thuMs = 0;
async function gioiThieu(act, items, { tuDau = false, xemLai = false, quayVe = null } = {}) {
  const d = dangCua(act);
  const { than } = khung;
  if (tuDau) mocGioiThieu = Date.now();
  than.innerHTML = "";
  const c = h("div", "kt-intro");
  c.append(h("div", "kt-nhan", "HƯỚNG DẪN"));
  c.append(h("div", "kt-de", d.de));
  const dsVd = h("div", "kt-vidu-ds");
  c.append(dsVd);
  const dan = h("ul", "kt-dan");
  const chan = h("div", "kt-chan");
  c.append(dan, chan);
  than.append(c);
  let huy = false;
  const phimId = Symbol();
  gioiThieu.dangChay = phimId;
  const conChay = () => !huy && gioiThieu.dangChay === phimId && c.isConnected;
  const boQua = nut("Bỏ qua phim ›", "kt-phu-btn", () => { huy = true; veHet(); });
  chan.append(boQua);

  function theVd(v) {
    const the = h("div", "kt-vidu");
    const viet = h("div", "kt-vidu-viet", v.viet);
    const mui = h("div", "kt-vidu-mui", "→");
    const o = h("div", "kt-vidu-o");
    const chu = h("span", "kt-vidu-chu", "");
    const nhay = h("span", "kt-nhay");
    o.append(chu, nhay);
    const ghi = h("div", "kt-vidu-ghi", v.ghiChu);
    the.append(viet, mui, o, ghi);
    return { the, chu, ghi, nhay };
  }
  function veHet() {
    dsVd.innerHTML = "";
    d.viDu.forEach(v => { const t = theVd(v); t.chu.textContent = v.anh; t.the.classList.add("hien", "xong"); dsVd.append(t.the); });
    dan.innerHTML = "";
    LOI_DAN.forEach(x => { const li = h("li", "hien", x); dan.append(li); });
    ketThuc();
  }
  function ketThuc() {
    chan.innerHTML = "";
    if (xemLai) chan.append(nut("ĐÃ HIỂU — QUAY LẠI BÀI", "kt-chinh", () => quayVe && quayVe()));
    else {
      chan.append(nut("Xem lại", "kt-phu-btn", () => gioiThieu(act, items)));
      chan.append(nut("LÀM THỬ ›", "kt-chinh", () => lamThu(act, items)));
    }
  }
  // phim: từng ví dụ hiện ra, chữ tiếng Anh tự gõ từng phím, rồi ghi chú hiện
  for (const v of d.viDu) {
    if (!conChay()) return;
    const t = theVd(v);
    dsVd.append(t.the);
    await cho(60); t.the.classList.add("hien");
    await cho(700);
    for (const ch of v.anh) { if (!conChay()) return; t.chu.textContent += ch; await cho(95); }
    t.the.classList.add("xong");
    await cho(500);
    t.ghi.classList.add("hien");
    await cho(1100);
  }
  for (const x of LOI_DAN) {
    if (!conChay()) return;
    const li = h("li", "", x); dan.append(li);
    await cho(40); li.classList.add("hien");
    await cho(650);
  }
  if (conChay()) ketThuc();
}

// ================= LÀM THỬ =================
function lamThu(act, items) {
  const d = dangCua(act);
  if (mocGioiThieu) { gioiThieuMs += Date.now() - mocGioiThieu; mocGioiThieu = 0; }
  const bd = Date.now();
  const { than } = khung;
  let i = 0;
  function ve() {
    than.innerHTML = "";
    const c = h("div", "kt-cau kt-thu");
    c.append(h("div", "kt-nhan", `LÀM THỬ ${i + 1}/${d.thu.length}`));
    const it = d.thu[i];
    c.append(h("div", "kt-de-cau", it.prompt));
    const o = taoO();
    c.append(o.dong);
    const bao = h("div", "kt-bao");
    c.append(bao);
    const nuts = h("div", "kt-nuts");
    const kiem = nut("KIỂM TRA", "kt-chinh", () => cham());
    nuts.append(kiem);
    c.append(nuts);
    than.append(c);
    o.inp.focus();
    o.onEnter = () => cham();
    let daDung = false;
    function cham() {
      if (daDung) { tiep(); return; }
      const v = o.inp.value;
      if (!v.trim()) { o.inp.focus(); return; }
      if (dung(v, it.acceptedAnswers)) {
        daDung = true;
        bao.className = "kt-bao dung";
        bao.textContent = "Đúng rồi! 🎉";
        o.inp.classList.add("dung"); o.inp.disabled = true;
        kiem.textContent = i < d.thu.length - 1 ? "CÂU TIẾP ›" : "XONG ›";
        kiem.focus();
      } else {
        thuSai++;
        bao.className = "kt-bao sai";
        bao.innerHTML = "";
        bao.append(h("div", "kt-bao-dau", "Chưa đúng rồi."), h("div", "kt-bao-hd", it.huongDan));
        o.inp.classList.add("sai");
        setTimeout(() => o.inp.classList.remove("sai"), 600);
        o.inp.focus(); o.inp.select();
      }
    }
    function tiep() { i++; if (i < d.thu.length) ve(); else xongThu(); }
  }
  function xongThu() {
    thuMs += Date.now() - bd;
    than.innerHTML = "";
    const c = h("div", "kt-giua");
    c.append(h("div", "kt-nhan", "SẴN SÀNG CHƯA?"));
    c.append(h("div", "kt-to", "Em đã làm xong phần thử!"));
    c.append(h("div", "kt-phu", `Bài thật có ${items.length} câu. Bài thật sẽ KHÔNG báo đúng sai — em cứ làm hết sức mình.`));
    const nuts = h("div", "kt-nuts");
    nuts.append(nut("Làm thử lại", "kt-phu-btn", () => lamThu(act, items)));
    nuts.append(nut("BẮT ĐẦU LÀM BÀI", "kt-chinh kt-lon", () => lamBai(act, items, null)));
    c.append(nuts);
    than.append(c);
  }
  ve();
}

// ---------- ô nhập (dùng chung cho làm thử + bài thật) ----------
// Chặn: dán (Ctrl+V, chuột phải, kéo-thả, dán của bàn phím điện thoại), sao chép/cắt, menu chuột phải, kéo chữ ra.
// Chỉ nhận chữ tiếng Anh (bỏ ký tự ngoài ASCII); máy bật UniKey vẫn gõ ra đúng phím (core/vn-guard.js, Đợt 419).
let demDan = null, demPhim = null;   // bài thật gắn hàm đếm vào đây
function taoO() {
  const dong = h("div", "kt-o-dong");
  const inp = h("input", "kt-o");
  inp.type = "text";
  inp.autocomplete = "off"; inp.spellcheck = false;
  inp.setAttribute("autocorrect", "off"); inp.setAttribute("autocapitalize", "off");
  inp.setAttribute("enterkeyhint", "next");
  inp.maxLength = 200;
  dong.append(inp);
  const o = { dong, inp, onEnter: null };
  const chanSk = e => { e.preventDefault(); if (demDan && (e.type === "paste" || e.type === "drop" || e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop")) demDan(); };
  ["paste", "copy", "cut", "drop", "dragstart", "contextmenu"].forEach(t => inp.addEventListener(t, chanSk));
  inp.addEventListener("beforeinput", e => {
    if (/^insertFrom(Paste|Drop|Yank)|^insertReplacementText$/.test(e.inputType || "")) chanSk(e);
  });
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); o.onEnter && o.onEnter(); return; }
    if ((e.ctrlKey || e.metaKey) && /^[vxc]$/i.test(e.key)) { e.preventDefault(); if (/v/i.test(e.key) && demDan) demDan(); return; }
    if (demPhim && (e.key.length === 1 || e.key === "Backspace")) demPhim();
  });
  const loc = () => {
    const v = inp.value, s = v.replace(/[^\x20-\x7E]/g, "");
    if (s !== v) { const p = Math.max(0, (inp.selectionStart ?? s.length) - (v.length - s.length)); inp.value = s; inp.setSelectionRange(p, p); }
  };
  inp.addEventListener("input", loc);
  inp.addEventListener("compositionend", loc);
  const chen = ch => {
    const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
    inp.value = inp.value.slice(0, a) + ch + inp.value.slice(b);
    inp.setSelectionRange(a + ch.length, a + ch.length);
  };
  const xoa = () => {
    const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
    if (a === b) { if (!a) return; inp.value = inp.value.slice(0, a - 1) + inp.value.slice(b); inp.setSelectionRange(a - 1, a - 1); }
    else { inp.value = inp.value.slice(0, a) + inp.value.slice(b); inp.setSelectionRange(a, a); }
  };
  try { guardVnTyping({ accepts: e => e.target === inp && !inp.disabled, insert: chen, backspace: xoa, input: inp, afterSet: () => {} }); }
  catch (e) { /* bộ gõ: chỉ là lưới đỡ */ }
  return o;
}

// ================= BÀI THẬT =================
function moiTrangThai(items) {
  return {
    pha: "lam", i: 0, hang: null, daMs: 0,
    ds: items.map(() => ({ typed: "", ms: 0, anMs: 0, roi: 0, mat: 0, matMs: 0, dan: 0, phim: 0, lanXem: 0, xong: false, boQua: false })),
    lamLai: 0, taiLai: 0, gioiThieuMs: 0, thuSai: 0, thuMs: 0, luot: newPlayLogId(), luotTao: gioChuan()
  };
}
function lamBai(act, items, s) {
  if (!s) {
    s = moiTrangThai(items);
    s.gioiThieuMs = gioiThieuMs; s.thuSai = thuSai; s.thuMs = thuMs;
  }
  const { than, dongHo, menu } = khung;
  dongHo.hidden = false; menu.hidden = false;
  let doan = Date.now();            // mốc đầu đoạn đang đếm (đồng hồ bài)
  let cauMoc = Date.now();          // mốc đầu câu đang xem
  let anTu = 0, matTu = 0;          // đang rời trang / mất tiêu điểm từ lúc nào
  let dangMenu = false, daNop = false;
  const tongMs = () => s.daMs + (dangMenu ? 0 : Date.now() - doan);
  const cau = () => s.ds[s.i];

  // ----- nhật ký lượt (practiceLog) — mỗi lần bắt đầu/làm lại là một lượt -----
  const log = () => ({ code: CODE, id: s.luot, name: TEN || "Học sinh", ma: MA, mode: "submit", again: s.lamLai > 0, mistakes: false,
    score: 0, total: items.length, timeMs: tongMs(), done: false, attemptId: "", createdAt: s.luotTao, activeMs: tongMs() });
  beatPlayLog(log()).catch(() => {});
  const nhip = setInterval(() => { if (!daNop) { luu(); beatPlayLog(log()).catch(() => {}); } }, 60000);

  // ----- theo dõi rời trang / chuyển ứng dụng -----
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
  const onHide = () => { if (daNop) return; chotCau(false); luu(); beatPlayLog(log(), { keepalive: true }); };
  window.addEventListener("pagehide", onHide);
  demDan = () => { cau().dan++; nhacDan(); };
  demPhim = () => { cau().phim++; };

  // đồng hồ hiển thị
  const tick = setInterval(() => { dongHo.textContent = mmss(tongMs()); }, 500);
  dongHo.textContent = mmss(tongMs());
  menu.onclick = () => moMenu();

  function luu() { if (!daNop) ghiLuu({ ...s, daMs: tongMs() }); }
  // cộng thời gian đang xem câu hiện tại vào câu đó (gọi trước khi rời câu)
  function chotCau(roiCau = true) {
    const c = cau(), t = Date.now();
    if (!dangMenu) c.ms += t - cauMoc;
    cauMoc = t;
    if (anTu) { c.anMs += t - anTu; anTu = roiCau ? 0 : t; }
    if (matTu) { c.matMs += t - matTu; matTu = roiCau ? 0 : t; }
  }

  let o = null, nhacEl = null;
  function nhacDan() {
    if (!nhacEl) return;
    nhacEl.textContent = "Bài kiểm tra không cho dán chữ — em hãy tự gõ nhé.";
    nhacEl.classList.add("hien");
    clearTimeout(nhacDan.t); nhacDan.t = setTimeout(() => nhacEl && nhacEl.classList.remove("hien"), 2500);
  }

  function ve() {
    const it = items[s.i], c = cau();
    c.lanXem++;
    cauMoc = Date.now();
    than.innerHTML = "";
    const k = h("div", "kt-cau");
    const tren = h("div", "kt-tien");
    const conLai = s.hang ? ` · làm lại câu bỏ trống (${s.hang.length} câu)` : "";
    tren.append(h("div", "kt-nhan", `CÂU ${s.i + 1}/${items.length}${conLai}`));
    const vach = h("div", "kt-vach"); const day = h("i"); day.style.width = (100 * s.ds.filter(x => x.xong && !x.boQua).length / items.length) + "%";
    vach.append(day); tren.append(vach);
    k.append(tren);
    k.append(h("div", "kt-de-cau", it.prompt));
    o = taoO();
    o.inp.value = c.typed || "";
    k.append(o.dong);
    nhacEl = h("div", "kt-nhac"); k.append(nhacEl);
    const nuts = h("div", "kt-nuts");
    nuts.append(nut("BỎ QUA", "kt-phu-btn", () => traLoi(true)));
    const cuoi = laCuoi();
    nuts.append(nut(cuoi ? "NỘP BÀI" : "TIẾP ›", "kt-chinh", () => traLoi(false)));
    k.append(nuts);
    than.append(k);
    o.onEnter = () => traLoi(false);
    o.inp.focus();
    luu();
  }
  function laCuoi() { return s.hang ? s.hang.length <= 1 : s.i === items.length - 1; }

  function traLoi(boQua) {
    if (daNop || dangMenu) return;
    const v = boQua ? "" : o.inp.value.trim().replace(/\s+/g, " ");
    if (!boQua && !v) { o.inp.focus(); return; }
    chotCau();
    const c = cau();
    c.typed = v; c.xong = true; c.boQua = !v;
    // câu kế tiếp
    if (s.hang) {
      s.hang = s.hang.filter(x => x !== s.i);
      if (s.hang.length) { s.i = s.hang[0]; return ve(); }
      s.hang = null;
      return ketThuc();
    }
    if (s.i < items.length - 1) { s.i++; return ve(); }
    ketThuc();
  }

  function ketThuc() {
    const trong = s.ds.map((c, i) => (c.boQua || !c.typed ? i : -1)).filter(i => i >= 0);
    if (trong.length && !s.hoiTrong) {
      s.hoiTrong = true;
      than.innerHTML = "";
      const c = h("div", "kt-giua");
      c.append(h("div", "kt-to", `Em còn ${trong.length} câu để trống`));
      c.append(h("div", "kt-phu", "Em có muốn quay lại làm thử các câu đó không?"));
      const nuts = h("div", "kt-nuts");
      nuts.append(nut("LÀM CÁC CÂU TRỐNG", "kt-phu-btn", () => { s.hang = trong; s.i = trong[0]; ve(); }));
      nuts.append(nut("NỘP BÀI", "kt-chinh", () => nop()));
      c.append(nuts);
      than.append(c);
      cauMoc = Date.now();
      luu();
      return;
    }
    nop();
  }

  async function nop() {
    if (daNop) return;
    daNop = true;
    const timeMs = tongMs();
    clearInterval(tick); clearInterval(nhip);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus);
    window.removeEventListener("pagehide", onHide);
    demDan = null; demPhim = null;
    menu.hidden = true;
    const review = items.map((it, i) => {
      const c = s.ds[i];
      const yourCorrect = dung(c.typed, it.acceptedAnswers);
      return {
        question: it.prompt, answered: !!c.typed, yourText: c.typed || "", yourCorrect, correctText: it.acceptedAnswers[0],
        ms: Math.round(c.ms), anMs: Math.round(c.anMs), roi: c.roi, mat: c.mat, matMs: Math.round(c.matMs),
        dan: c.dan, phim: c.phim, lanXem: c.lanXem, boQua: !c.typed
      };
    });
    review[0].kt = { lamLai: s.lamLai, taiLai: s.taiLai, gioiThieuMs: Math.round(s.gioiThieuMs), thuSai: s.thuSai, thuMs: Math.round(s.thuMs), phienBan: 1 };
    const score = review.filter(r => r.yourCorrect).length;
    xoaLuu();
    thongBao("Đang nộp bài...", "Em chờ một chút nhé.");
    const entry = queueAttempt({ code: CODE, studentName: TEN || "Học sinh", ma: MA, score, total: items.length, timeMs, review });
    const ghiLog = () => beatPlayLog({ ...log(), timeMs, activeMs: timeMs, done: true, attemptId: entry.attemptId }).catch(() => {});
    let kq = await sendAttempt(entry).catch(() => ({ ok: false }));
    if (kq && kq.ok) {
      try { localStorage.setItem(KHOA_XONG, "1"); } catch (e) { /* thôi */ }
      ghiLog();
      baoMe("xong");
      try { window.parent !== window && window.parent.postMessage({ type: "AWORD:NOP", code: CODE, name: TEN }, "*"); } catch (e) { /* thôi */ }
      return manXong(act, {});
    }
    // chưa nộp được: bài vẫn nằm trong hộp thư đi (outbox) của máy, mở lại là tự gửi
    const thuLai = async () => {
      thongBao("Đang nộp lại...", "");
      kq = await sendAttempt(entry).catch(() => ({ ok: false }));
      if (kq && kq.ok) {
        try { localStorage.setItem(KHOA_XONG, "1"); } catch (e) { /* thôi */ }
        ghiLog(); baoMe("xong"); return manXong(act, {});
      }
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

  // ----- ☰ MENU -----
  function moMenu() {
    if (dangMenu || daNop) return;
    chotCau(false);
    s.daMs = tongMs(); dangMenu = true;
    const nen = h("div", "kt-menu-nen");
    const hop = h("div", "kt-menu-hop");
    hop.append(h("div", "kt-to", "Menu"));
    const dong = () => { nen.remove(); dangMenu = false; doan = Date.now(); cauMoc = Date.now(); if (o) o.inp.focus(); };
    hop.append(nut("TIẾP TỤC LÀM BÀI", "kt-chinh", dong));
    hop.append(nut("Xem lại hướng dẫn", "kt-phu-btn", () => {
      nen.remove();
      const giu = than.innerHTML;   // dựng lại câu khi quay về
      gioiThieu(act, items, { xemLai: true, quayVe: () => { dangMenu = false; doan = Date.now(); ve(); } });
      void giu;
    }));
    hop.append(nut("Làm lại từ đầu", "kt-phu-btn kt-do", () => xacNhanLamLai()));
    function xacNhanLamLai() {
      hop.innerHTML = "";
      hop.append(h("div", "kt-to", "Làm lại từ đầu?"));
      hop.append(h("div", "kt-phu", "Mọi câu em đã làm sẽ bị xoá, em bắt đầu lại từ câu 1."));
      const nuts = h("div", "kt-nuts");
      nuts.append(nut("Không", "kt-phu-btn", dong));
      nuts.append(nut("LÀM LẠI", "kt-chinh kt-do", () => {
        nen.remove();
        // lượt cũ = bỏ dở (done=false), ghi lần cuối rồi mở lượt mới
        beatPlayLog({ ...log(), timeMs: s.daMs, activeMs: s.daMs }).catch(() => {});
        const cu = s;
        const moi = moiTrangThai(items);
        moi.lamLai = cu.lamLai + 1; moi.taiLai = cu.taiLai;
        moi.gioiThieuMs = cu.gioiThieuMs; moi.thuSai = cu.thuSai; moi.thuMs = cu.thuMs;
        Object.keys(s).forEach(k => delete s[k]); Object.assign(s, moi);
        dangMenu = false; doan = Date.now();
        beatPlayLog(log()).catch(() => {});
        ve();
      }));
      hop.append(nuts);
    }
    nen.append(hop);
    nen.addEventListener("click", e => { if (e.target === nen) dong(); });
    khung.k.append(nen);
  }

  baoMe("dang-lam");
  ve();
}

// ================= XONG =================
function manXong(act, { daNopTruoc = false } = {}) {
  khung.dongHo.hidden = true; khung.menu.hidden = true;
  const { than } = khung;
  than.innerHTML = "";
  const c = h("div", "kt-giua kt-xong");
  c.append(h("div", "kt-sao", "★"));
  c.append(h("div", "kt-to", daNopTruoc ? "Em đã hoàn thành bài này" : "Chúc mừng em đã hoàn thành!"));
  c.append(h("div", "kt-phu", daNopTruoc ? "Bài làm đã được gửi tới thầy Andrew." : "Bài làm đã được gửi tới thầy Andrew. Em làm tiếp bài bên dưới nhé."));
  than.append(c);
}

// Chặn sao chép đề sang phần mềm dịch: cả trang không cho bôi đen/copy (CSS user-select + sự kiện).
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("cut", e => e.preventDefault());
document.addEventListener("contextmenu", e => e.preventDefault());
