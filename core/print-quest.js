// =============================================================
// PRINT QUEST — Đợt 435 (thầy chốt 01/10/2026, mẫu `D:\OTHERS\CLAUDE\AWord - thiet ke in quest\mau-v5-quest.html`)
//
// Hai dạng in MỚI cho act WORDS có bộ nghĩa (thay sheet Logic-Quest / Translation-Quest của file Excel):
//   · LOGIC QUEST       — mô tả (bộ nghĩa đã chọn, thường VI1) + ô WORD trống: em suy ra từ.
//   · TRANSLATION QUEST — mô tả (thường ENG2) + dòng "Translate:" để dịch + ô WORD trống.
// Chung cả hai:
//   · WORD BANK ở ĐẦU bài, 4 cột, mọi ô CÙNG cỡ chữ (từ đậm + phiên âm dưới) — không thu nhỏ từ dài.
//   · XÁO 2 lần mỗi BỘ ĐỀ: thứ tự CÂU và thứ tự từ trong WORD BANK — theo HẠT GIỐNG (seed) ⇒ in lại bộ cũ
//     ra đúng thứ tự cũ, bài check cũ vẫn khớp.
//   · CHIA TRANG: một câu KHÔNG BAO GIỜ bị cắt sang trang sau; tổng trang CHẴN, tối thiểu 2 (1 tờ 2 mặt);
//     vượt 2 thì giãn đủ 4 (6…). Hàng được NỚI đều (tìm nhị phân) cho đầy trang, không để khoảng trống thừa.
//   · Đầu trang: mã bài · dạng · LỚP + NGÀY (đổi được ở màn in) · Name; chân: Andrew Classes · MÃ BỘ · trang x/y.
//   · BÀI CHECK (bản thầy): y hệt bản học sinh của CÙNG bộ (cùng chia trang), chữ ĐEN, đáp án XÁM CỰC MỜ
//     (5% — iPad nhìn gần thấy, chiếu TOMKO học sinh không thấy; thầy viết đè lên như giấy nháp).
//     Dựng thành PDF (html2canvas + jsPDF, cdnjs) ⇒ Storage `baiCheck/` ⇒ link có token tải (QR / iPad).
//   · BỘ ĐỀ lưu ở Firestore `boDeIn/{id}` (CHỈ thầy — luật `myLesson-app/tools/dang-luat-lop-them.js`):
//     {actId, actNum, actTen, kieu, so, ma:'LQ-3', bo, seed, items(snapshot), pdf, tep, soTrang, tao, ngayTao, lop[]}.
//     Bản chụp `items` ⇒ in lại bộ cũ ra ĐÚNG nội dung lúc tạo, kể cả khi act đã sửa sau đó.
// =============================================================

import { db, fs } from "./firebase.js";
import { qrSvg } from "./qr.js";

export const KIEU_QUEST = {
  logic: { ten: "LOGIC QUEST", tien: "LQ", boGoiY: "vi1" },
  trans: { ten: "TRANSLATION QUEST", tien: "TQ", boGoiY: "eng2" }
};
export const MO_DAP_AN = 0.05;   // thầy chốt 01/10 (thanh kéo mẫu v3): đáp án bài check 5% độ đậm

// ---------- chặn "quét chuột bôi đen ra ngoài làm đóng pop-up" (gọi một lần ở main.js) ----------
// Nhấn trong ô/khung, thả trên nền mờ ⇒ trình duyệt bắn `click` lên TỔ TIÊN CHUNG (chính nền mờ) ⇒ mọi hộp
// "bấm nền = đóng" đóng oan. Pha bắt: cú click có điểm nhấn ≠ điểm click mà đang bôi chữ / nhấn trong ô nhập ⇒ nuốt.
let daChan = false;
export function chanQuetChuotDongPopup() {
  if (daChan) return; daChan = true;
  let nhan = null;
  document.addEventListener("mousedown", e => { nhan = e.target; }, true);
  document.addEventListener("click", e => {
    const n = nhan; nhan = null;
    if (!n || n === e.target || !e.target.contains || !e.target.contains(n)) return;
    let dangBoi = false;
    try { dangBoi = String(window.getSelection() || "").length > 0; } catch { /* no selection API */ }
    const laO = n.closest && n.closest("input, textarea, [contenteditable='true']");
    if (dangBoi || laO) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}

// ---------- dữ liệu ----------
// Act WORDS có bộ nghĩa ⇒ [{w, ipa, nd, vi1}] theo bộ `bo` ("vi1"/"eng2"/…).
export function rowsQuest(libAct, bo) {
  const items = (libAct && libAct.content && libAct.content.items) || [];
  return items.filter(it => it && it.word).map(it => {
    const c = it.clues || {};
    return { w: String(it.word).trim(), ipa: String(it.ipa || "").trim(), nd: String(c[bo] || it.clue || "").trim(), vi1: String(c.vi1 || "").trim() };
  });
}
export function coQuest(libAct) {
  const items = (libAct && libAct.content && libAct.content.items) || [];
  return items.some(it => it && it.word && it.clues && Object.keys(it.clues).length);
}
// "LSB1-S1.T1.P3-4 / WORDS" ⇒ "LSB1-S1.T1.P3-4"
export const maBaiCua = (libAct) => String((libAct && libAct.title) || "").split("/")[0].trim() || "Worksheet";

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function xao(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function boXao(items, seed) { const r = rng(seed); return { ds: xao(items, r), bank: xao(items, r) }; }
export const hatMoi = () => Math.floor(Math.random() * 2147483646) + 1;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MM = 96 / 25.4;

// ---------- dựng trang ----------
function dauTrang(o, kieu) {
  return `<div class="aw-qp-dau"><span class="aw-qp-ma">${esc(o.maBai)}</span><span class="aw-qp-loai">${KIEU_QUEST[kieu].ten}</span>`
    + `<span class="aw-qp-lop">${esc([o.lop, o.ngay].filter(Boolean).join(" · "))}</span>`
    + (o.laCheck ? `<span class="aw-qp-check">BÀI CHECK · ${esc(o.maBo || "")}</span>` : `<span class="aw-qp-ten">Name: ..................................................</span>`)
    + `</div>`;
}
const chanTrang = (o, t, n) => `<div class="aw-qp-chan"><span>Andrew Classes</span><span class="aw-qp-mabo">${esc(o.maBo || "")}</span><span>${t}/${n}</span></div>`;
function bankHtml(bank) {
  return `<div class="aw-qp-bank"><div class="aw-qp-bank-td">WORD BANK</div><div class="aw-qp-bank-luoi">`
    + bank.map(x => `<div class="aw-qp-tu"><b>${esc(x.w)}</b><i>${esc(x.ipa)}</i></div>`).join("") + `</div></div>`;
}
function hangHtml(x, so, laTrans, laCheck) {
  const oTu = laCheck ? `<td class="aw-qp-tudien"${laTrans ? ' rowspan="2"' : ""}><b>${esc(x.w)}</b><i>${esc(x.ipa)}</i></td>` : `<td${laTrans ? ' rowspan="2"' : ""}></td>`;
  if (!laTrans) return `<tr class="aw-qp-cau"><td class="aw-qp-so">${so}</td><td>${esc(x.nd)}</td>${oTu}</tr>`;
  return `<tr class="aw-qp-cau"><td class="aw-qp-so" rowspan="2">${so}</td><td class="aw-qp-dn">${esc(x.nd)}</td>${oTu}</tr>`
    + `<tr><td class="aw-qp-dich">Translate:${laCheck && x.vi1 ? `<span class="aw-qp-goiy">Gợi ý: ${esc(x.vi1)}</span>` : ""}</td></tr>`;
}
function bangHtml(ds, laTrans, laCheck, dauSo) {
  return `<table class="aw-qp-bang"><colgroup><col class="aw-qp-c-so"><col><col class="aw-qp-c-tu"></colgroup>`
    + `<thead><tr><th>NO.</th><th>INFORMATION</th><th>WORD</th></tr></thead><tbody>`
    + ds.map((x, i) => hangHtml(x, dauSo + i + 1, laTrans, laCheck)).join("") + `</tbody></table>`;
}
function trangHtml(o, kieu, noiDung, t, n) {
  return `<div class="aw-qp-trang">${dauTrang(o, kieu)}<div class="aw-qp-than">${noiDung}</div>${chanTrang(o, t, n)}</div>`;
}

// ĐO + CHIA (đo trên bản BÀI CHECK — dòng cao nhất ⇒ hai bản chia y hệt nhau, đặt chồng là khớp).
function chiaTrang(o, kieu, bo) {
  const laTrans = kieu === "trans";
  const probe = document.createElement("div");
  probe.className = "aw-qp-probe";
  probe.innerHTML = trangHtml({ ...o, laCheck: true }, kieu, bankHtml(bo.bank) + bangHtml(bo.ds, laTrans, true, 0), 1, 1);
  document.body.append(probe);
  const than = probe.querySelector(".aw-qp-than");
  const cao = than.getBoundingClientRect().height - 3;   // chừa 3px: làm tròn mm→px từng làm tràn 1px mép bảng
  const bank = probe.querySelector(".aw-qp-bank").getBoundingClientRect().height + 4 * MM;
  const thead = probe.querySelector("thead").getBoundingClientRect().height;
  const trH = [...probe.querySelectorAll("tbody tr")].map(tr => tr.getBoundingClientRect().height);
  probe.remove();
  const cau = []; let k = 0;
  for (let i = 0; i < bo.ds.length; i++) { const h = trH[k] + (laTrans ? trH[k + 1] : 0); cau.push(h); k += laTrans ? 2 : 1; }
  const xep = (them) => {
    const ra = []; let con = cao - bank - thead, dem = 0;
    cau.forEach(h => { const hh = h + them * (laTrans ? 2 : 1); if (hh > con && dem) { ra.push(dem); dem = 0; con = cao - thead; } con -= hh; dem++; });
    ra.push(dem); return ra;
  };
  const tuNhien = xep(0).length;
  const muc = Math.max(2, tuNhien % 2 ? tuNhien + 1 : tuNhien);
  let lo = 0, hi = 60 * MM;
  for (let n = 0; n < 30; n++) { const g = (lo + hi) / 2; if (xep(g).length <= muc) lo = g; else hi = g; }
  return { trang: xep(lo), them: lo, muc, tuNhien, trH };
}

// Dựng tờ in (bản HỌC SINH hoặc BÀI CHECK). o = {maBai, lop, ngay, maBo, items, seed, laCheck}
// Trả { sheet, soTrang, tuNhien }. `sheet` là `.aw-print-sheet.aw-print-<kieu>quest` có @page riêng (lề 0).
export async function dungTrangQuest(kieu, o) {
  await document.fonts.ready;
  const bo = boXao(o.items, o.seed);
  const k = chiaTrang(o, kieu, bo);
  const laTrans = kieu === "trans";
  let html = "", dau = 0;
  k.trang.forEach((n, t) => {
    const phan = bo.ds.slice(dau, dau + n);
    html += trangHtml(o, kieu, (t === 0 ? bankHtml(bo.bank) : "") + bangHtml(phan, laTrans, !!o.laCheck, dau), t + 1, k.muc);
    dau += n;
  });
  for (let t = k.trang.length; t < k.muc; t++) html += trangHtml(o, kieu, "", t + 1, k.muc);   // bù trang trống (hiếm)
  const sheet = document.createElement("div");
  sheet.className = `aw-print-sheet aw-print-${kieu}quest aw-qp-sheet` + (o.laCheck ? " is-check" : "");
  sheet.style.setProperty("--qp-mo", String(o.mo ?? MO_DAP_AN));
  const st = document.createElement("style");
  st.textContent = "@page { size: A4; margin: 0; }";
  sheet.append(st);
  sheet.insertAdjacentHTML("beforeend", html);
  // chiều cao dòng DÙNG CHUNG (đo trên bài check) + phần nới
  sheet.querySelectorAll("tbody tr").forEach((tr, i) => { tr.style.height = (k.trH[i] + k.them) + "px"; });
  return { sheet, soTrang: k.muc, tuNhien: k.tuNhien };
}

// In tờ (bản học sinh) bằng hộp in của máy — cùng nếp finishAndPrint của print.js.
export function inTo(sheet) {
  document.body.append(sheet);
  let xong = false;
  const don = () => { if (xong) return; xong = true; sheet.remove(); window.removeEventListener("afterprint", don); };
  window.addEventListener("afterprint", don);
  setTimeout(() => window.print(), 40);
  setTimeout(don, 120000);
}

// ---------- PDF bài check (html2canvas + jsPDF từ cdnjs, nạp khi cần) ----------
const CDN = {
  h2c: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  jspdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
};
const napScript = (src) => new Promise((ok, loi) => {
  if (document.querySelector(`script[src="${src}"]`)) return ok();
  const s = document.createElement("script"); s.src = src; s.onload = () => ok(); s.onerror = () => loi(new Error("Không tải được " + src));
  document.head.append(s);
});
export async function pdfTuTo(sheet) {
  await Promise.all([napScript(CDN.h2c), napScript(CDN.jspdf)]);
  const { jsPDF } = window.jspdf;
  const host = document.createElement("div");
  host.className = "aw-qp-chup";
  sheet.style.display = "block";
  host.append(sheet);
  document.body.append(host);
  try {
    await document.fonts.ready;
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const trangs = [...sheet.querySelectorAll(".aw-qp-trang")];
    for (let i = 0; i < trangs.length; i++) {
      const c = await window.html2canvas(trangs[i], { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      if (i) pdf.addPage();
      pdf.addImage(c.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297);
    }
    return pdf.output("blob");
  } finally { host.remove(); }
}

// ---------- Storage: đẩy PDF bài check ----------
export async function dayBaiCheck(blob, tenTep) {
  await db();   // bảo đảm app mặc định đã khởi tạo (firebase.js không xuất app())
  const [{ getStorage, ref, uploadBytes, getDownloadURL }, { getApp }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js"),
    import("https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js")]);
  const r = ref(getStorage(getApp()), "baiCheck/" + tenTep);
  await uploadBytes(r, blob, { contentType: "application/pdf" });
  return { url: await getDownloadURL(r), tep: "baiCheck/" + tenTep };
}

// ---------- Firestore: bộ đề ----------
export async function dsBoDe(libAct, kieu) {
  const [d, { collection, getDocs, query, where }] = await Promise.all([db(), fs()]);
  const snap = await getDocs(query(collection(d, "boDeIn"), where("actId", "==", String(libAct.id || ""))));
  const ds = [];
  snap.forEach(s => { const x = s.data(); if (x.kieu === kieu) ds.push({ ...x, id: s.id }); });
  return ds.sort((a, b) => (b.so || 0) - (a.so || 0));
}
export async function luuBoDe(id, data) {
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, "boDeIn", id), data, { merge: true });
}
export async function themLopVaoBo(id, lop) {
  if (!lop) return;
  const [d, { doc, updateDoc, arrayUnion }] = await Promise.all([db(), fs()]);
  await updateDoc(doc(d, "boDeIn", id), { lop: arrayUnion(lop) });
}

// ---------- iPad / iPhone: hộp Chia sẻ (Notability…) ----------
export const laThietBiChamIOS = () => (navigator.maxTouchPoints > 1 && /Macintosh|iPad|iPhone/i.test(navigator.userAgent)) || /iPhone|iPad|iPod/i.test(navigator.userAgent);
const PDF_SAN = new Map();       // url -> Blob (tải SẴN ở cú chạm đầu — iOS chỉ cho share NGAY trong cú chạm)
export async function taiSan(url) {
  if (!url) throw new Error("Bộ này chưa có bài check.");
  if (PDF_SAN.has(url)) return PDF_SAN.get(url);
  const r = await fetch(url); if (!r.ok) throw new Error("Không tải được bài check (" + r.status + ").");
  const b = await r.blob(); PDF_SAN.set(url, b); return b;
}
export const daSan = (url) => PDF_SAN.has(url);
// ⛔ GỌI NGAY trong cú chạm, KHÔNG await gì trước đó (iOS mất quyền "user activation" ⇒ NotAllowedError).
export function chiaSe(url, tenTep) {
  const b = PDF_SAN.get(url);
  if (!b) return Promise.reject(new Error("Bài check chưa tải xong — chạm đúp lại sau 1 giây."));
  const f = new File([b], tenTep, { type: "application/pdf" });
  if (!navigator.canShare || !navigator.canShare({ files: [f] })) return Promise.reject(new Error("Máy này không chia sẻ được file — dùng nút QR."));
  return navigator.share({ files: [f], title: tenTep });
}

// ---------- pop-up QR + link ----------
export function moQr(url, tieuDe) {
  const nen = document.createElement("div");
  nen.className = "aw-print-pop-overlay";
  nen.innerHTML = `<div class="aw-qp-qr"><h4>${esc(tieuDe)}</h4><p>Quét bằng camera iPad / iPhone để mở bài check</p>`
    + `<div class="aw-qp-qrimg">${qrSvg(url, { quiet: 2 })}</div><div class="aw-qp-qrlink">${esc(url)}</div>`
    + `<div class="aw-qp-qrnut"><button type="button" data-chep>Chép link</button><button type="button" data-dong>Đóng</button></div></div>`;
  let nhanNen = false;
  nen.addEventListener("mousedown", e => { nhanNen = e.target === nen; });
  nen.addEventListener("click", e => {
    if ((e.target === nen && nhanNen) || e.target.closest("[data-dong]")) nen.remove();
    if (e.target.closest("[data-chep]")) navigator.clipboard?.writeText(url).then(() => { e.target.textContent = "Đã chép"; }, () => {});
  });
  document.body.append(nen);
}
