// =============================================================
// LỚP + HỌC SINH ĐỌC TỪ DASHBOARD — Đợt 435 (thầy chốt 01/10/2026)
//
// Thầy chốt: DASHBOARD myLesson là nơi DUY NHẤT nhập lớp · lịch tuần · học sinh. AWord không nhập lớp
// riêng nữa — mọi chỗ cần danh sách lớp (Settings ▸ Classes, ô chọn lớp ở màn In, Showdown, Running
// team, ô Class của form giao bài) đọc từ đây qua `listClasses()` (core/classes.js).
//
// Hai nguồn:
//   · `lessonWeb/lop`  — CÔNG KHAI (đọc không cần đăng nhập), một chuỗi JSON `json`: {lop:[…], khoa:[…]},
//                         mỗi lớp {maLop, tenGoc, lich:[{tu, buoi:[{thu(getDay), vao:"17h40", tan}]}], hocSinh:[{id, ten, ma}]}.
//   · `lopThem/chung`  — CHỈ THẦY (luật laThay): `gt` {khoá em: 'm'|'f'} (giới tính, sửa ở dashboard) +
//                         `tam` {mã lớp: [{id, ten, gt, luc, nguon}]} (HỌC SINH TẠM — thêm được ngay trong AWord,
//                         dashboard thấy + xoá được; xoá bên nào cũng mất cả hai bên — một bản ghi, hai cửa nhìn).
// Khoá em = `khoaEm()` — Y HỆT dashboard (`dsNguoi().khoa`): mã đăng nhập chuẩn, em chưa có mã thì `<LỚP>#<id>`.
// ⛔ Ghi `lopThem` TỪNG TRƯỜNG (setDoc merge `tam.<lớp>`) — dashboard + AWord ghi cùng lúc không đè nhau.
// =============================================================

import { db, fs } from "./firebase.js";

export const THU_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const chuanMa = (s) => String(s || "").replace(/\s+/g, "").toUpperCase();
export function khoaEm(maLop, h) { const m = chuanMa(h && h.ma); return m || (maLop + "#" + (h && h.id)); }
export const gioChu = (s) => String(s || "").replace(/h/i, ":");          // "17h40" -> "17:40"

let docP = null;
async function docHai(ep) {
  if (ep) docP = null;
  if (!docP) docP = (async () => {
    const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
    const [a, b] = await Promise.all([
      getDoc(doc(d, "lessonWeb", "lop")),
      getDoc(doc(d, "lopThem", "chung")).then(x => x, e => ({ __loi: e }))
    ]);
    const j = a.exists() ? JSON.parse(a.data().json || "null") : null;
    if (!j) throw new Error("Không đọc được danh sách lớp của dashboard (lessonWeb/lop).");
    const loiThem = b && b.__loi ? (b.__loi.code || String(b.__loi)) : "";
    const them = (!loiThem && b.exists()) ? b.data() : {};
    return { j, gt: them.gt || {}, tam: them.tam || {}, loiThem };
  })();
  try { return await docP; } catch (e) { docP = null; throw e; }
}
export function quenLopDashboard() { docP = null; }

// Danh sách lớp + khóa của dashboard, mỗi em kèm giới tính; em TẠM xếp cuối lớp (`tam:true`).
export async function dsLopDashboard(ep) {
  const { j, gt, tam, loiThem } = await docHai(ep);
  const cac = [...(j.lop || []).map(c => [c, false]), ...(j.khoa || []).map(c => [c, true])];
  const seen = new Set();
  const lop = cac.filter(([c]) => c && c.maLop && !seen.has(c.maLop) && seen.add(c.maLop)).map(([c, laKhoa]) => {
    const chinh = (c.hocSinh || []).map(h => {
      const k = khoaEm(c.maLop, h);
      return { id: "w" + h.id, webId: h.id, khoa: k, name: String(h.ten || "").trim(), gender: gt[k] === "m" || gt[k] === "f" ? gt[k] : "" };
    });
    const dsTam = (Array.isArray(tam[c.maLop]) ? tam[c.maLop] : []).map(t => ({
      id: "t_" + t.id, tamId: String(t.id), name: String(t.ten || "").trim(), gender: t.gt === "m" || t.gt === "f" ? t.gt : "",
      tam: true, nguon: t.nguon || "", luc: t.luc || 0
    }));
    return { maLop: c.maLop, ten: c.tenGoc || c.maLop, laKhoa, lich: Array.isArray(c.lich) ? c.lich : [], students: chinh.concat(dsTam) };
  });
  return { lop, loiThem };
}

// Buổi học của lớp trong ngày `d` theo lịch tuần dashboard (đợt hiệu lực = `tu` lớn nhất ≤ ngày đó).
// Trả { vao:"17:45", tan:"19:15" } hoặc null.
// ⛔ Ngày theo GIỜ MÁY (không toISOString — sau 17:00 giờ VN là đã sang ngày UTC khác).
export const isoNgay = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function dotHieuLuc(lich, d) {
  const iso = isoNgay(d);
  return (lich || []).filter(x => x && (!x.tu || x.tu <= iso)).sort((a, b) => String(a.tu || "").localeCompare(String(b.tu || ""))).pop();
}
export function buoiTrongNgay(lich, d = new Date()) {
  const dot = dotHieuLuc(lich, d);
  const b = dot && (dot.buoi || []).find(x => +x.thu === d.getDay());
  return b ? { vao: gioChu(b.vao), tan: gioChu(b.tan) } : null;
}
// Các thứ học trong tuần, "T2 · T5" (đợt hiệu lực hôm nay).
export function thuHoc(lich, d = new Date()) {
  const dot = dotHieuLuc(lich, d);
  return dot ? (dot.buoi || []).map(x => THU_VN[+x.thu] || "").filter(Boolean).join(" · ") : "";
}

// ---- học sinh TẠM: đọc mới ngay trước khi ghi (đừng ghi đè em tạm máy khác vừa thêm) ----
async function tamMoi(maLop) {
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const s = await getDoc(doc(d, "lopThem", "chung"));
  const t = s.exists() ? (s.data().tam || {}) : {};
  return Array.isArray(t[maLop]) ? t[maLop].map(x => ({ ...x })) : [];
}
async function ghiTam(maLop, ds) {
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, "lopThem", "chung"), { tam: { [maLop]: ds }, luc: Date.now() }, { merge: true });
  quenLopDashboard();
}
export async function themHsTam(maLop, ten, gt = "") {
  const t = String(ten || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!t) throw new Error("Hãy gõ tên học sinh.");
  const ds = await tamMoi(maLop);
  if (ds.length >= 20) throw new Error("Lớp này đã có 20 học sinh tạm.");
  ds.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ten: t, gt: gt === "m" || gt === "f" ? gt : "", luc: Date.now(), nguon: "aword" });
  await ghiTam(maLop, ds);
}
export async function xoaHsTam(maLop, id) {
  const ds = (await tamMoi(maLop)).filter(x => String(x.id) !== String(id));
  await ghiTam(maLop, ds);
}
export async function doiGtTam(maLop, id, gt) {
  const ds = await tamMoi(maLop);
  const x = ds.find(y => String(y.id) === String(id));
  if (!x) return;
  x.gt = gt === "m" || gt === "f" ? gt : "";
  await ghiTam(maLop, ds);
}
