// =============================================================
// PODIUM-SAO — THƯỞNG / PHẠT SAO + VÍ + GỬI ĐỘI SANG myTeam ở PODIUM Showdown (Đợt 542, thầy 17/10/2026).
//
// Thầy: "có thêm nút sao và ví để có các tùy chọn thưởng cho các đội và chốt sao lên ví như trong bảng kết quả bài tập
// ở dashboard (góc dưới bên phải) · sao được thưởng hiện ở quả bóng icon · giữ thẻ tên để mở pop-up thưởng sao cho cá
// nhân · nút myTeam (ngoài cùng bên phải, ngăn bằng vạch mảnh) đưa đội sang myTeam".
//
// ⭐ Y HỆT dashboard (myLesson web `js/sao-xh.js` v1.338.0 — thầy chốt mẫu v5), chép cách làm + giao diện (`podium-sao.css`
//    = bản chép `css/sao-xh.css`):
//   · thưởng/phạt = SAO TẠM (huy hiệu VIỀN ĐỨT trên quả avatar) — chỉ trong máy này (localStorage theo trận), chưa ghi kho;
//   · nút VÍ ⇒ hỏi lại ⇒ ghi PHIẾU `saoDot` thật (nguon 'dashboard' — thầy chốt, không sửa máy chủ; từng dòng app 'aword';
//     bai = "sd_<classId>_<matchId>") ⇒ hàm máy chủ `apDotSao` cộng/trừ ví ⇒ huy hiệu ĐẶC (= đã vào ví).
//   · Mọi định danh = SỐ HỌC SINH 6 chữ số (hsSo/soCai, ghép theo mã đăng nhập `khoa` của lớp dashboard).
//     Em TẠM / LỚP TẠM không có số ⇒ vẫn hiện sao trên bóng cho vui, KHÔNG vào ví được (báo khi chốt).
// ⭐ myTeam: ghi `users/{uid}/items/myteam_doi` (kho riêng của thầy — KHÔNG luật Firestore mới; myTeam đọc bằng khoá quản
//    trị) rồi gọi myTeam: trong myActivity ⇒ console `MYACT:MYTEAM:<id>` (myActivity mở/kéo myTeam lên); trình duyệt
//    thường (Chrome) ⇒ `myteam://nhan?id=<id>` (myTeam đăng ký đường mở này; Chrome hỏi "Mở myTeam?" lần đầu).
//
// ⛔ File này CHỈ được nạp LƯỜI (dynamic import) — showdown-review.js phải sạch Firestore (engine nạp nó).
// ⛔ Tên học sinh luôn đi bằng textContent / esc().
// =============================================================

import { el } from "./utils.js";
import { avatarNode } from "./avatar.js";

const GIU_MS = 450;
const SAO = '<svg viewBox="0 0 24 24"><path d="M12 2.3l2.95 6.3 6.9.85-5.08 4.75 1.3 6.85L12 17.7l-6.07 3.35 1.3-6.85L2.15 9.45l6.9-.85z"/></svg>';
const VI_IC = '<svg viewBox="0 0 24 24"><path d="M4 8.5V7a2.5 2.5 0 0 1 2.5-2.5H17a1.5 1.5 0 0 1 1.5 1.5v2.5"/><rect x="3" y="8.5" width="18" height="11.5" rx="2.6"/><path d="M21 12.5h-4.2a1.8 1.8 0 0 0 0 3.6H21"/><circle cx="16.9" cy="14.3" r=".6"/></svg>';
const TEAM_IC = '<svg viewBox="0 0 24 24"><circle cx="8" cy="8.5" r="3.2"/><circle cx="16.6" cy="9.4" r="2.6"/><path d="M2.6 19.6c.5-3.3 2.8-5.2 5.4-5.2s4.9 1.9 5.4 5.2"/><path d="M13.6 15.1c.9-.7 1.9-1 3-1 2.3 0 4.1 1.6 4.6 4.6"/></svg>';
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const chuanMa = s => String(s || "").replace(/\s+/g, "").toUpperCase();
const ngayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const ddmm = () => { const d = ngayVN(); return d.slice(8, 10) + "/" + d.slice(5, 7); };
const cat120 = s => { s = String(s || "").trim(); return s.length > 120 ? s.slice(0, 119) + "…" : s; };
const TEN_DOI = { l: "ĐỘI XANH", r: "ĐỘI CAM" };

// ── CSS + gradient sao (một lần mỗi trang) ──
function gaCss() {
  if (document.getElementById("aw-psx-css")) return;
  const l = document.createElement("link");
  l.id = "aw-psx-css"; l.rel = "stylesheet";
  l.href = new URL("./podium-sao.css?v=1", import.meta.url).href;
  document.head.appendChild(l);
  const d = document.createElement("div");
  d.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<radialGradient id="sxVang" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#FFF6C2"/><stop offset=".45" stop-color="#FFD43B"/><stop offset="1" stop-color="#F09A00"/></radialGradient>' +
    '<radialGradient id="sxDo" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#FFD9D9"/><stop offset=".45" stop-color="#F87171"/><stop offset="1" stop-color="#B91C1C"/></radialGradient></defs></svg>';
  document.body.appendChild(d.firstChild);
}
const goc = () => document.fullscreenElement || document.body;   // pop-up phải nằm TRONG khung đang toàn màn hình

// ── kho chung (mỗi trang): số HS · ví · lý do nhanh ──
const K = { maSo: null, vi: {}, ly: null, napLuc: 0, hua: null, dot: {}, dotHua: {} };
async function kho() {
  const f = await import("./firebase.js");
  const [db, fs, user] = await Promise.all([f.db(), f.fs(), f.currentUser()]);
  return { db, fs, user };
}
function napChung(ep) {
  if (K.hua && !ep && Date.now() - K.napLuc < 5 * 60e3) return K.hua;
  K.napLuc = Date.now();
  K.hua = kho().then(({ db, fs }) => Promise.all([
    fs.getDoc(fs.doc(db, "hsSo", "soCai")),
    fs.getDoc(fs.doc(db, "saoTong", "chung")).catch(() => null),
    fs.getDoc(fs.doc(db, "saoCaiDat", "chung")).catch(() => null)
  ])).then(r => {
    const so = (r[0] && r[0].exists() && r[0].data().nguoi) || {}, m = {};
    Object.keys(so).forEach(n => {
      const P = so[n] || {};
      if (P.ma) m[chuanMa(P.ma)] = n;
      (P.maCu || []).forEach(x => { if (!m[chuanMa(x)]) m[chuanMa(x)] = n; });
    });
    K.maSo = m;
    K.vi = (r[1] && r[1].exists() && r[1].data().em) || {};
    const c = (r[2] && r[2].exists()) ? r[2].data() : {};
    K.ly = (c.lyDo && Array.isArray(c.lyDo.cong)) ? c.lyDo : null;
  }).catch(e => { K.hua = null; throw e; });
  return K.hua;
}
// Phiếu đã ghi của trận này: { số: [{n, ly}] }
function napDot(baiId, ep) {
  if (!baiId) return Promise.resolve({});
  if (K.dotHua[baiId] && !ep) return K.dotHua[baiId];
  K.dotHua[baiId] = kho().then(({ db, fs }) => fs.getDocs(fs.query(fs.collection(db, "saoDot"), fs.where("bai", "==", baiId))))
    .then(q => {
      const m = {};
      q.forEach(d => {
        const p = d.data() || {};
        (p.dong || []).forEach(l => { if (l.so && Number(l.n)) (m[l.so] = m[l.so] || []).push({ n: Number(l.n), ly: l.viec || "" }); });
      });
      K.dot[baiId] = m;
      return m;
    }).catch(() => { K.dotHua[baiId] = null; return K.dot[baiId] || {}; });
  return K.dotHua[baiId];
}

// ── sao TẠM của một trận: localStorage `aw_psx_<baiId>` = { khoá em: [{n, ly, ten, so, tao}] } ──
function docTam(baiId) {
  if (!baiId) return {};
  try { return JSON.parse(localStorage.getItem("aw_psx_" + baiId) || "{}") || {}; } catch { return {}; }
}
function ghiTam(baiId, tm) {
  if (!baiId) return;
  try {
    const coGi = Object.keys(tm).some(k => (tm[k] || []).length);
    if (coGi) localStorage.setItem("aw_psx_" + baiId, JSON.stringify(tm));
    else localStorage.removeItem("aw_psx_" + baiId);
  } catch { /* bộ nhớ trình duyệt đầy/khoá: sao tạm chỉ sống tới lúc đóng trang */ }
}

/**
 * @param {object} o
 *   classId, lopMa (mã lớp "A2B"), lopTen (tên đẹp), laTam (lớp tạm), actName,
 *   baiId: () => "sd_<classId>_<matchId>" | "" (trận chưa lưu xong),
 *   picks: Map key → "l"|"r" (chính Map của Podium), toast
 */
export function taoSaoPodium(o) {
  gaCss();
  const toast = o.toast || (() => {});
  const avs = new Map();            // khoá em → { av, ten, hang, pct }
  let vaiTro = null;                // roster lớp: khoá em → { khoa, ten, tam }
  let tools = null;                 // { vi, dem, team }

  // ---------- ai là ai ----------
  async function napLop() {
    if (vaiTro) return vaiTro;
    vaiTro = new Map();
    try {
      const { listClasses } = await import("./classes.js");
      const c = (await listClasses()).find(x => x.id === o.classId) || null;
      ((c && c.students) || []).forEach(s => vaiTro.set(String(s.id), { khoa: s.khoa || "", ten: s.name, tam: !!s.tam || !!(c && c.tamThoi) }));
      if (c) {
        if (c.tamThoi) o.laTam = true;
        if (!o.lopTen && c.label) o.lopTen = c.label;
        if (tools && o.laTam) { tools.team.disabled = true; tools.team.title = "Lớp tạm không có trong myTeam"; }
      }
    } catch (e) { console.warn("AWord: podium stars — class roster unavailable", e); }
    return vaiTro;
  }
  function soCua(key) {
    if (o.laTam || !K.maSo || !vaiTro) return null;
    let v = vaiTro.get(String(key));
    if (!v) {                                         // khoá lạ (trận cũ lưu theo tên) ⇒ tìm theo TÊN duy nhất
      const ten = ((avs.get(key) || {}).ten || "").trim().toLowerCase();
      const trung = [...vaiTro.values()].filter(x => String(x.ten || "").trim().toLowerCase() === ten);
      v = trung.length === 1 ? trung[0] : null;
    }
    if (!v || v.tam || !v.khoa || v.khoa.includes("#")) return null;
    return K.maSo[chuanMa(v.khoa)] || null;
  }
  const baiId = () => (typeof o.baiId === "function" ? o.baiId() : o.baiId) || "";
  function napHet() {
    return Promise.all([napChung(), napLop(), napDot(baiId())]);
  }

  // ---------- huy hiệu trên quả avatar ----------
  function chip(a, cls) {
    if (!a.length) return "";
    const s = a.reduce((t, x) => t + x.n, 0);
    const tit = a.map(x => (x.n > 0 ? "+" : "") + x.n + " · " + x.ly).join("\n");
    return `<i class="aw-psx-hh ${cls}" title="${esc(tit)}">${s > 0 ? "+" : ""}${s}${SAO}</i>`;
  }
  function veMot(key, moi) {
    const v = avs.get(key);
    if (!v || !v.av) return;
    const so = soCua(key);
    const da = (so && K.dot[baiId()] && K.dot[baiId()][so]) || [];
    const tm = docTam(baiId())[key] || [];
    const duong = a => a.filter(x => x.n > 0), am = a => a.filter(x => x.n < 0);
    const html = chip(duong(da), "vi") + chip(am(da), "vi phat") + chip(duong(tm), "tam") + chip(am(tm), "tam phat");
    let h = v.av.querySelector(":scope > .aw-psx-hhs");
    if (!html) { if (h) h.remove(); return; }
    if (!h) { h = el("span", "aw-psx-hhs"); v.av.append(h); }
    if (h.innerHTML !== html) {
      h.innerHTML = html;
      if (moi) h.querySelectorAll(moi === "vi" ? ".vi" : ".tam").forEach(x => x.classList.add("moi"));
    }
  }
  function veHet(moi) {
    avs.forEach((_, k) => veMot(k, moi && moi[k]));
    capNhatVi();
  }
  function dsTam() {
    const tm = docTam(baiId());
    return Object.keys(tm).filter(k => (tm[k] || []).length).map(k => {
      const a = tm[k];
      return { key: k, so: soCua(k) || a[0].so || null, ten: a[0].ten, ds: a,
        cong: a.filter(x => x.n > 0).reduce((s, x) => s + x.n, 0), tru: a.filter(x => x.n < 0).reduce((s, x) => s + x.n, 0) };
    });
  }
  function capNhatVi() {
    if (!tools) return;
    const n = dsTam().length;
    tools.vi.disabled = !n; tools.dem.hidden = !n; tools.dem.textContent = n;
  }

  // ---------- lý do gợi ý ----------
  const duoi = () => " / " + (o.actName || "SHOWDOWN") + " · NGÀY " + ddmm();
  function lyNhanh(k) {
    const ds = (K.ly && K.ly[k]) || (k === "cong" ? [{ t: "Phát biểu tốt" }, { t: "Giúp bạn" }] : [{ t: "Vi phạm nội quy" }]);
    return ds.slice(0, 4).map(x => ({ t: String(x.t).toUpperCase() + " · NGÀY " + ddmm(), nhan: x.t }))
      .filter(x => !/đổi quà|bấm nhầm/i.test(x.nhan));
  }
  function goiYEm(key) {
    const v = avs.get(key) || {}, d = duoi(), thuong = [], phat = [];
    if (v.hang && v.hang <= 3) thuong.push({ t: "TOP " + v.hang + " SHOWDOWN" + d, nhan: "Top " + v.hang + " Showdown" });
    if (v.pct === 100) thuong.push({ t: "ĐIỂM TUYỆT ĐỐI SHOWDOWN" + d, nhan: "Điểm tuyệt đối" });
    const doi = o.picks && o.picks.get(key);
    if (doi) thuong.push({ t: TEN_DOI[doi] + " THẮNG" + d, nhan: (doi === "l" ? "Đội xanh" : "Đội cam") + " thắng" });
    phat.push({ t: "KHÔNG TẬP TRUNG KHI CHƠI" + d, nhan: "Không tập trung" });
    return { thuong: thuong.concat(lyNhanh("cong")), phat: phat.concat(lyNhanh("tru")) };
  }
  function goiYNhom(nhom) {
    const d = duoi(), lop = o.lopMa || "";
    if (nhom === "lop") return {
      thuong: [{ t: "CẢ LỚP " + lop + " CHƠI SHOWDOWN TỐT" + d, nhan: "Cả lớp chơi tốt" }, { t: "CẢ LỚP " + lop + " TẬP TRUNG" + d, nhan: "Cả lớp tập trung" }].concat(lyNhanh("cong")),
      phat: [{ t: "LỚP " + lop + " MẤT TRẬT TỰ" + d, nhan: "Lớp mất trật tự" }].concat(lyNhanh("tru"))
    };
    const ten = TEN_DOI[nhom];
    return {
      thuong: [{ t: ten + " THẮNG SHOWDOWN" + d, nhan: ten.charAt(0) + ten.slice(1).toLowerCase() + " thắng" }, { t: ten + " CHƠI TỐT" + d, nhan: "Chơi tốt" }].concat(lyNhanh("cong")),
      phat: [{ t: ten + " MẤT TRẬT TỰ" + d, nhan: "Mất trật tự" }].concat(lyNhanh("tru"))
    };
  }

  // ---------- khung pop-up (y dashboard) ----------
  let MO = null;
  function taoPop(cls) {
    if (MO) MO.dong();
    const tp = el("div", "sx-tp " + cls);
    goc().appendChild(tp);
    const p = { el: tp, khiDong: null };
    const ngoai = e => { if (!tp.contains(e.target) && !(e.target.closest && e.target.closest(".aw-psx-tools"))) p.dong(); };
    const phim = e => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); p.dong(); } };
    p.dong = () => {
      tp.remove(); document.removeEventListener("pointerdown", ngoai, true); document.removeEventListener("keydown", phim, true);
      if (p.khiDong) p.khiDong(); if (MO === p) MO = null;
    };
    setTimeout(() => { document.addEventListener("pointerdown", ngoai, true); document.addEventListener("keydown", phim, true); }, 0);
    MO = p; return p;
  }
  function phanChung(st) {
    const ds = st.kieu === "thuong" ? st.gy.thuong : st.gy.phat, l = ds[st.chon] || ds[0] || { t: "" };
    st.lyHien = st.lyTu || l.t;
    return '<div class="sx-sao">' + [1, 2, 3].map(k => `<button type="button" data-s="${k}" class="${k <= st.n ? "bat" : ""}">${SAO}</button>`).join("") + "</div>" +
      '<div class="sx-ly"><h5>LÝ DO</h5><div class="sx-chip">' + ds.map((x, j) => `<button type="button" data-j="${j}" class="${j === st.chon && !st.lyTu ? "on" : ""}">${esc(x.nhan)}</button>`).join("") + "</div></div>" +
      '<div class="sx-xem"><small>GHI VÀO LỊCH SỬ SAO CỦA ' + (st.nhom ? "TỪNG EM" : "EM") + '</small><div contenteditable="true" spellcheck="false">' + esc(st.lyHien) + "</div></div>";
  }
  function ganChung(st, ve) {
    const tp = st.p.el;
    tp.querySelectorAll(".sx-tab [data-k]").forEach(b => {
      b.onclick = () => { const k = b.getAttribute("data-k"); if (st.kieu === k) return; st.kieu = k; st.chon = 0; st.lyTu = ""; st.n = st.macDinh(k); ve(); };
    });
    tp.querySelectorAll("[data-s]").forEach(b => {
      b.onclick = () => { const k = +b.getAttribute("data-s"); st.n = (k === st.n) ? k - 1 : k; ve(); const x = st.n && tp.querySelector(`[data-s="${st.n}"]`); if (x) x.classList.add("nay"); };
    });
    tp.querySelectorAll("[data-j]").forEach(b => { b.onclick = () => { st.chon = +b.getAttribute("data-j"); st.lyTu = ""; ve(); }; });
    const ed = tp.querySelector("[contenteditable]");
    ed.oninput = () => { st.lyTu = ed.textContent; };
    ed.onkeydown = e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); ed.blur(); } };
    tp.querySelector(".sx-x").onclick = st.p.dong;
  }
  const nutOk = (st, soEm) => '<div class="sx-loi" hidden></div><button type="button" class="sx-ok"' + (st.n ? "" : " disabled") + ">" + SAO +
    (st.n ? (st.kieu === "phat" ? "PHẠT " : "THƯỞNG ") + st.n + " SAO" + (soEm != null ? " · " + soEm + " EM" : "") : "BẤM VÀO SAO ĐỂ CHỌN") + "</button>";
  const baoLoi = (tp, chu) => { const l = tp.querySelector(".sx-loi"); if (l) { l.hidden = false; l.textContent = chu; } };
  function avHtml(ten) {
    const a = avatarNode(o.laTam ? "" : o.lopMa, ten, "aw-av bm-em-av");
    return a.outerHTML;
  }
  function datCanh(p, r) {
    const w = p.el.offsetWidth, h = p.el.offsetHeight;
    const phai = r.right + 14 + w < innerWidth - 8, x = phai ? r.right + 14 : Math.max(8, r.left - 14 - w);
    const y = Math.max(10, Math.min(innerHeight - h - 10, r.top + r.height / 2 - 34)), my = Math.max(14, Math.min(h - 28, r.top + r.height / 2 - y - 7));
    p.el.style.left = x + "px"; p.el.style.top = y + "px";
    p.el.style.setProperty("--ox", phai ? "0" : "100%"); p.el.style.setProperty("--oy", (r.top + r.height / 2 - y) + "px");
    const m = p.el.querySelector(".sx-mui") || p.el.appendChild(document.createElement("i"));
    m.className = "sx-mui"; m.style.cssText = "top:" + my + "px;" + (phai ? "left:-6px" : "right:-6px");
  }

  // ---------- POP-UP MỘT EM (giữ thẻ tên / giữ quả bóng) ----------
  function moEm(key, anchor) {
    const v = avs.get(key); if (!v) return;
    const ten = v.ten, gy = goiYEm(key);
    const macDinh = k => k === "thuong" ? (v.hang && v.hang <= 3 ? 1 : 0) : 0;
    const p = taoPop("em"), st = { p, gy, kieu: "thuong", n: macDinh("thuong"), chon: 0, lyTu: "", macDinh };
    anchor && anchor.classList.add("aw-psx-chon");
    p.khiDong = () => { anchor && anchor.classList.remove("aw-psx-chon"); };
    function ve() {
      const so = soCua(key), vi = so ? (Number((K.vi[so] || {}).s) || 0) : null;
      const da = ((so && K.dot[baiId()] && K.dot[baiId()][so]) || []).concat((docTam(baiId())[key] || []).map(x => ({ n: x.n, ly: x.ly, tam: 1 })));
      p.el.className = "sx-tp em" + (st.kieu === "phat" ? " phat" : "");
      const phu = o.laTam ? '<span style="color:#B7791F">lớp tạm — không có ví</span> · '
        : so ? "Ví đang có <i>⭐ " + vi + "</i> · " : (K.maSo ? '<span style="color:#DC2626">chưa có số HS — không vào ví</span> · ' : "");
      p.el.innerHTML =
        '<div class="sx-dau">' + avHtml(ten) + '<div class="t"><b>' + esc(ten) + "</b><small>" + phu + esc(o.lopTen || o.lopMa || "") + '</small></div><button class="sx-x" type="button" title="Đóng">✕</button></div>' +
        '<div class="sx-tab"><span class="nen"></span><button type="button" data-k="thuong">AWARD</button><button type="button" data-k="phat">PUNISHMENT</button></div>' +
        phanChung(st) +
        (da.length ? '<div class="sx-da' + (da.some(x => x.ly === st.lyHien) ? " do" : "") + '">Ở trận này đã ' + da.map(x => (x.n > 0 ? "thưởng +" : "phạt ") + x.n + " (" + esc(String(x.ly).split(" / ")[0]) + ")" + (x.tam ? " — tạm" : "")).join(", ") + "</div>" : "") +
        nutOk(st, null);
      ganChung(st, ve);
      p.el.querySelector(".sx-ok").onclick = () => {
        if (!st.n) return;
        if (!baiId()) return baoLoi(p.el, "Trận đang được lưu — thử lại sau giây lát.");
        const ly = cat120(st.lyTu || st.lyHien), n = st.kieu === "phat" ? -st.n : st.n;
        p.dong(); ghiVaBay([key], n, ly, false);
      };
      datCanh(p, (anchor && anchor.isConnected ? anchor : v.av).getBoundingClientRect());
    }
    ve();
    napHet().then(() => { if (MO === p) ve(); }).catch(() => { /* chưa đăng nhập: vẫn thưởng tạm được */ });
  }

  // ---------- POP-UP ĐỘI / CẢ LỚP (nút ⭐) ----------
  function nguoiNhom(nhom) {
    const ds = [...avs.keys()];
    if (nhom === "lop") return ds;
    return ds.filter(k => o.picks && o.picks.get(k) === nhom);
  }
  function moNhom(nut) {
    const coDoi = nguoiNhom("l").length && nguoiNhom("r").length;
    const p = taoPop("lop");
    const st = { p, nhom: coDoi ? "l" : "lop", kieu: "thuong", n: 1, chon: 0, lyTu: "", macDinh: () => 1 };
    st.gy = goiYNhom(st.nhom);
    nut.classList.add("sx-mo");
    p.khiDong = () => nut.classList.remove("sx-mo");
    function ve() {
      const ng = nguoiNhom(st.nhom);
      p.el.className = "sx-tp lop" + (st.kieu === "phat" ? " phat" : "");
      const btn = (k, chu) => {
        const n = nguoiNhom(k).length;
        return `<button type="button" data-nh="${k}" class="${st.nhom === k ? "on" : ""} is-${k}"${n ? "" : " disabled"}>${chu} (${n})</button>`;
      };
      p.el.innerHTML =
        '<div class="sx-dau"><span class="sx-ic">' + SAO + '</span><div class="t"><b>' + esc(o.lopTen || o.lopMa || "") + "</b><small>" + avs.size + " em · " + esc(o.actName || "Showdown") + '</small></div><button class="sx-x" type="button" title="Đóng">✕</button></div>' +
        '<div class="sx-ap aw-psx-nhom">' + btn("l", "Đội xanh") + btn("r", "Đội cam") + btn("lop", "Cả lớp") + "</div>" +
        '<div class="sx-tab"><span class="nen"></span><button type="button" data-k="thuong">AWARD</button><button type="button" data-k="phat">PUNISHMENT</button></div>' +
        phanChung(st) + nutOk(st, ng.length);
      ganChung(st, ve);
      p.el.querySelectorAll("[data-nh]").forEach(b => {
        b.onclick = () => { const k = b.getAttribute("data-nh"); if (k === st.nhom) return; st.nhom = k; st.gy = goiYNhom(k); st.chon = 0; st.lyTu = ""; ve(); };
      });
      p.el.querySelector(".sx-ok").onclick = () => {
        if (!st.n || !ng.length) return;
        if (!baiId()) return baoLoi(p.el, "Trận đang được lưu — thử lại sau giây lát.");
        const ly = cat120(st.lyTu || st.lyHien), n = st.kieu === "phat" ? -st.n : st.n;
        p.dong(); ghiVaBay(ng, n, ly, true);
      };
      const r = nut.getBoundingClientRect(), w = p.el.offsetWidth, h = p.el.offsetHeight;
      const x = Math.max(10, Math.min(innerWidth - w - 10, r.right - w + 6));
      const y = Math.max(10, r.top - h - 12);
      p.el.style.left = x + "px"; p.el.style.top = y + "px";
      p.el.style.setProperty("--ox", (r.left + r.width / 2 - x) + "px"); p.el.style.setProperty("--oy", h + "px");
      const m = p.el.querySelector(".sx-mui") || p.el.appendChild(document.createElement("i"));
      m.className = "sx-mui"; m.style.cssText = "bottom:-6px;right:" + Math.max(10, x + w - (r.left + r.width / 2) - 7) + "px";
    }
    ve();
    napHet().then(() => { if (MO === p) ve(); }).catch(() => {});
  }

  // ---------- thưởng/phạt = SAO TẠM ⇒ sao bay vào quả avatar ----------
  function ghiVaBay(keys, n, ly, laNhom) {
    const id = baiId(), tm = docTam(id), moi = {}, luc = Date.now();
    keys.forEach(k => {
      const v = avs.get(k); if (!v) return;
      (tm[k] = tm[k] || []).push({ n, ly, ten: v.ten, so: soCua(k), tao: luc });
      moi[k] = "tam";
    });
    ghiTam(id, tm);
    capNhatVi();
    bayMan(keys, n, ly, laNhom, () => veHet(moi));
  }

  // ---------- NÚT VÍ: hỏi lại ⇒ phiếu saoDot thật ⇒ ảnh em nuốt sao ----------
  function hopHoi(html, cls) {
    const nen = el("div", "sx-xn-nen");
    nen.innerHTML = '<div class="sx-xn ' + (cls || "") + '">' + html + "</div>";
    goc().appendChild(nen);
    const phim = e => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); dong(); } };
    const dong = () => { nen.remove(); document.removeEventListener("keydown", phim, true); };
    document.addEventListener("keydown", phim, true);
    nen.addEventListener("click", e => { if (e.target === nen) dong(); });
    nen.querySelector(".sx-xn-x").onclick = dong;
    return { el: nen, dong };
  }
  function bangTam(ds) {
    const cong = ds.reduce((s, x) => s + x.cong, 0), tru = ds.reduce((s, x) => s + x.tru, 0);
    const c = (n, cls) => n ? '<i class="sx-hh ' + cls + '">' + (n > 0 ? "+" : "") + n + SAO + "</i>" : "";
    return '<div class="sx-xn-tong"><span class="em">' + ds.length + '<small>HỌC SINH</small></span><span class="la">' + (cong ? "+" + cong : "0") + '<small>SAO THƯỞNG</small></span><span class="do">' + (tru || "0") + "<small>SAO PHẠT</small></span></div>" +
      '<div class="sx-xn-ds">' + ds.map(x => '<div class="sx-xn-dong">' + avHtml(x.ten) + "<span>" + esc(x.ten) +
        '<span class="ly">' + (x.so ? "" : '<b style="color:#DC2626">không có ví · </b>') + esc(x.ds.map(d => String(d.ly).split(" / ")[0]).join(" · ")) + '</span></span><span class="so">' + c(x.cong, "tam") + c(x.tru, "tam phat") + "</span></div>").join("") + "</div>";
  }
  async function dayVaoVi(ds) {
    const id = baiId(), co = ds.filter(x => x.so);
    const dong = laCong => {
      const ra = [];
      co.forEach(x => x.ds.forEach(d => { if ((d.n > 0) === laCong) ra.push({ so: x.so, n: d.n, viec: d.ly, app: "aword" }); }));
      return ra;
    };
    const luc = Date.now();
    const phieu = (laCong, dg) => ({ nguon: "dashboard", lop: o.lopMa || "", ngay: ngayVN(), bai: id, maBai: o.actName || "Showdown",
      nhom: laCong ? "Thầy Andrew thưởng" : "Thầy Andrew phạt", ai: "Thầy Andrew", dong: dg, tao: luc });
    const cg = dong(true), tr = dong(false);
    const { db, fs } = await kho();
    const viec = [];
    for (let i = 0; i < cg.length; i += 300) viec.push(fs.addDoc(fs.collection(db, "saoDot"), phieu(true, cg.slice(i, i + 300))));
    for (let j = 0; j < tr.length; j += 300) viec.push(fs.addDoc(fs.collection(db, "saoDot"), phieu(false, tr.slice(j, j + 300))));
    await Promise.all(viec);
  }
  function nuotSao(ds, sauDo) {
    const id = baiId(), m = K.dot[id] = K.dot[id] || {}, moi = {};
    ds.forEach(x => {
      if (x.so) x.ds.forEach(d => { (m[x.so] = m[x.so] || []).push({ n: d.n, ly: d.ly }); const v = K.vi[x.so] = K.vi[x.so] || { s: 0 }; v.s = Math.max(0, (Number(v.s) || 0) + d.n); });
      moi[x.key] = "vi";
    });
    ghiTam(id, {});
    veHet(moi);
    ds.forEach((x, j) => setTimeout(() => {
      const v = avs.get(x.key); if (!v || !v.av.isConnected) return;
      const b = v.av.getBoundingClientRect();
      v.av.classList.remove("sx-av-nuot"); void v.av.offsetWidth; v.av.classList.add("sx-av-nuot");
      toeTia(b.left + b.width / 2, b.top + b.height / 2, false);
    }, j * 70));
    const coVi = ds.filter(x => x.so).length;
    setTimeout(() => {
      thongBao("✓ Đã đưa sao vào ví " + coVi + " học sinh" + (coVi < ds.length ? " · " + (ds.length - coVi) + " em không có ví (bỏ qua)" : ""), "la");
      setTimeout(() => { napDot(id, true).then(() => veHet()); napChung(true).catch(() => {}); }, 6000);
      if (sauDo) sauDo();
    }, ds.length * 70 + 500);
  }
  let DANG_DUA = false;
  function hoiVi(kieuDong, khiXong) {
    const ds = dsTam(); if (!ds.length || DANG_DUA) return false;
    const dau = kieuDong
      ? '<div class="sx-xn-dau"><span class="sx-xn-ic canh">' + SAO + "</span><div><b>Còn sao chưa đưa vào ví</b><small>" + ds.length + " học sinh còn sao TẠM ở trận này. Thầy muốn làm gì?</small></div></div>"
      : '<div class="sx-xn-dau"><span class="sx-xn-ic">' + VI_IC + "</span><div><b>Đưa sao vào ví?</b><small>" + esc(o.lopTen || o.lopMa || "") + " · " + esc(o.actName || "Showdown") + " — sao tạm sẽ thành sao THẬT trong ví từng em.</small></div></div>";
    const h = hopHoi('<button class="sx-xn-x" type="button" title="' + (kieuDong ? "Quay lại" : "Đóng") + '">✕</button>' + dau + bangTam(ds) +
      (kieuDong ? "" : '<div class="sx-xn-chu">Em được thưởng sẽ nhận thông báo "+N⭐". Sau khi vào ví, muốn sửa thì cộng/trừ lại ở hộp <b>Sao học sinh</b> của dashboard.</div>') +
      '<div class="sx-loi" hidden></div><div class="sx-xn-nut">' + (kieuDong ? '<button type="button" class="bo" data-bo>HỦY BỎ</button>' : '<button type="button" class="phu" data-x>HUỶ</button>') +
      '<button type="button" class="chinh" data-ok>' + VI_IC + "<span>ĐƯA VÀO VÍ</span></button></div>", kieuDong ? "canh" : "");
    const x = h.el.querySelector("[data-x]"); if (x) x.onclick = h.dong;
    const bo = h.el.querySelector("[data-bo]");
    if (bo) bo.onclick = () => { h.dong(); ghiTam(baiId(), {}); veHet(); if (khiXong) khiXong(false); };
    const ok = h.el.querySelector("[data-ok]");
    ok.onclick = async () => {
      const chu = ok.querySelector("span");
      try { await napHet(); } catch { /* báo dưới */ }
      const ds2 = dsTam();
      if (!ds2.some(y => y.so)) {
        baoLoi(h.el, o.laTam ? "Lớp tạm không có ví — sao chỉ để xem trên bóng." : "Không em nào có số học sinh (hoặc chưa đăng nhập tài khoản thầy).");
        return;
      }
      ok.disabled = true; DANG_DUA = true; chu.textContent = "ĐANG GHI…";
      try {
        await dayVaoVi(ds2);
        DANG_DUA = false; h.dong();
        nuotSao(ds2, khiXong ? () => khiXong(true) : null);
      } catch (e) {
        DANG_DUA = false; ok.disabled = false; chu.textContent = "ĐƯA VÀO VÍ";
        const s = String((e && (e.code || e.message)) || e);
        baoLoi(h.el, s.indexOf("permission") >= 0 ? "CHƯA GHI được — cần đăng nhập tài khoản thầy. Sao tạm vẫn giữ nguyên." : "CHƯA GHI được: " + s.slice(0, 80) + " — sao tạm vẫn giữ nguyên.");
      }
    };
    return true;
  }

  // ---------- NÚT myTeam ----------
  function doiHinh() {
    const thuTu = { l: 0, r: 0 };
    return [...avs.keys()].map(k => {
      const v = avs.get(k), side = o.picks ? o.picks.get(k) : null;
      const r = vaiTro && vaiTro.get(String(k));
      const team = side === "l" ? 0 : side === "r" ? 1 : -1;
      return { ten: v.ten, ma: r && r.khoa && !r.khoa.includes("#") ? r.khoa : "", so: soCua(k) || "", team, order: team < 0 ? null : ++thuTu[side] };
    });
  }
  function hoiMyTeam() {
    if (o.laTam) { thongBao("Lớp tạm không có trong myTeam."); return; }
    const ds0 = doiHinh();
    const nhom = t => ds0.filter(x => x.team === t);
    const dong = (t, chu, mau) => {
      const a = nhom(t);
      return '<div class="aw-psx-mt-doi"><b style="color:' + mau + '">' + chu + " · " + a.length + "</b><span>" + (a.length ? a.map(x => esc(x.ten)).join(", ") : "—") + "</span></div>";
    };
    const h = hopHoi('<button class="sx-xn-x" type="button" title="Đóng">✕</button>' +
      '<div class="sx-xn-dau"><span class="sx-xn-ic aw-psx-mt-ic">' + TEAM_IC + "</span><div><b>Đồng bộ đội sang myTeam?</b><small>" + esc(o.lopTen || o.lopMa || "") +
      " — lưu thành bản “Lưu đội” mới nhất của lớp này trong myTeam, chuyển myTeam sang lớp đó rồi mở myTeam.</small></div></div>" +
      '<div class="aw-psx-mt">' + dong(0, "ĐỘI XANH → TEAM 1", "#2563eb") + dong(1, "ĐỘI CAM → TEAM 2", "#e8590c") + dong(-1, "CHƯA CHIA → khu chờ", "#8A9A9E") + "</div>" +
      '<div class="sx-loi" hidden></div><div class="sx-xn-nut"><button type="button" class="phu" data-x>KHÔNG</button><button type="button" class="chinh aw-psx-mt-ok" data-ok>' + TEAM_IC + "<span>ĐỒNG BỘ + MỞ myTeam</span></button></div>");
    h.el.querySelector("[data-x]").onclick = h.dong;
    const ok = h.el.querySelector("[data-ok]");
    ok.onclick = async () => {
      ok.disabled = true; ok.querySelector("span").textContent = "ĐANG GỬI…";
      try {
        await Promise.all([napChung().catch(() => {}), napLop()]);
        const ds = doiHinh();                              // đọc lại sau khi đã có số HS
        const { db, fs, user } = await kho();
        if (!user) throw Object.assign(new Error("Cần đăng nhập tài khoản thầy."), { code: "aw/signed-out" });
        const id = Date.now().toString(36);
        await fs.setDoc(fs.doc(db, `users/${user.uid}/items`, "myteam_doi"), {
          id: "myteam_doi", kind: "myteam-doi", root: "showdown", parentId: null, trashed: false,
          guiId: id, luc: Date.now(), lop: o.lopMa || "", lopTen: o.lopTen || "", act: o.actName || "", ds
        });
        h.dong();
        moMyTeam(id);
      } catch (e) {
        ok.disabled = false; ok.querySelector("span").textContent = "ĐỒNG BỘ + MỞ myTeam";
        baoLoi(h.el, e && e.code === "aw/signed-out" ? "Cần đăng nhập tài khoản thầy (Google) trong AWord." : "Chưa gửi được: " + String((e && (e.code || e.message)) || e).slice(0, 80));
      }
    };
  }
  function moMyTeam(id) {
    const trongMyActivity = /myActivityHost\//.test(navigator.userAgent || "");
    if (trongMyActivity) {
      console.log("MYACT:MYTEAM:" + id);                 // myActivity (v2.35.0+) bắt dòng này ⇒ mở / kéo myTeam lên
      thongBao("✓ Đã gửi đội — đang mở myTeam…", "la");
      return;
    }
    // Trình duyệt thường: đường mở myteam:// (myTeam v1.18.0+ tự đăng ký khi chạy). Chrome hỏi "Mở myTeam?" lần đầu.
    const a = document.createElement("a");
    a.href = "myteam://nhan?id=" + encodeURIComponent(id);
    a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    thongBao("✓ Đã gửi đội sang myTeam. Không thấy myTeam mở? Mở myTeam một lần (bản mới) để máy nhận đường mở, rồi bấm lại.", "la");
  }

  // ---------- hiệu ứng (chép dashboard, đích = quả avatar của em) ----------
  function thongBao(chu, cls) {
    const t = el("div", "sx-toast" + (cls ? " " + cls : ""));
    t.textContent = chu;
    goc().appendChild(t); setTimeout(() => t.remove(), 4200);
  }
  function hoatAnh(n, kf, op) { try { return n.animate(kf, op); } catch { return { finished: Promise.resolve() }; } }
  function toeTia(x, y, phat) {
    for (let i = 0; i < 9; i++) {
      const t = el("i", "sx-tia-nho" + (phat ? " phat" : ""));
      t.style.left = x + "px"; t.style.top = y + "px"; goc().appendChild(t);
      const g = Math.PI * 2 * i / 9, d = 26 + Math.random() * 18;
      const a = hoatAnh(t, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(g) * d}px,${Math.sin(g) * d}px) scale(.2)`, opacity: 0 }], { duration: 520, easing: "cubic-bezier(.2,.8,.3,1)" });
      (a.finished || Promise.resolve()).then(() => t.remove(), () => t.remove());
    }
  }
  function bayMan(keys, n, ly, laNhom, xong) {
    const phat = n < 0, k = Math.abs(n);
    const tenDs = keys.map(x => (avs.get(x) || {}).ten || "");
    const man = el("div", "sx-man" + (phat ? " phat" : ""));
    const loi = laNhom ? (phat ? "Trừ sao · " : "Chúc mừng ") + (keys.length === avs.size ? "cả lớp " + esc(o.lopTen || o.lopMa || "") : esc(tenDs.slice(0, 4).join(", ") + (tenDs.length > 4 ? "…" : ""))) + (phat ? "" : "!")
      : (phat ? "Trừ sao · " : "Chúc mừng ") + esc(tenDs[0]) + (phat ? "" : "!");
    man.innerHTML = '<div class="sx-man-nen"></div><div class="sx-tia"></div><div class="sx-chu">' + (laNhom ? "" : "<b>" + (phat ? "−" : "+") + k + " " + SAO + "</b>") +
      "<span>" + loi + "</span><small>" + esc(ly) + "</small></div>";
    goc().appendChild(man);
    const cx = innerWidth / 2, cy = innerHeight * (laNhom ? 0.42 : 0.46), to = k === 1 ? (laNhom ? 170 : 190) : 150, kc = to * 0.93, lon = [];
    for (let i = 0; i < k; i++) {
      const s = el("div", "sx-bay"); s.innerHTML = SAO; s.style.opacity = "0";
      s.style.width = s.style.height = to + "px"; s.style.margin = (-to / 2) + "px 0 0 " + (-to / 2) + "px";
      const x = cx + (i - (k - 1) / 2) * kc, y = cy + (!laNhom && k > 1 ? Math.abs(i - (k - 1) / 2) * 14 : 0);
      man.appendChild(s); lon.push({ el: s, x, y, key: keys[0] });
      hoatAnh(s, [{ transform: `translate(${x}px,${y}px) scale(0) rotate(-140deg)`, opacity: 0 }, { transform: `translate(${x}px,${y}px) scale(1.25) rotate(8deg)`, opacity: 1, offset: .7 }, { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }],
        { duration: 620, delay: 120 + i * 110, easing: "cubic-bezier(.2,1.4,.4,1)", fill: "forwards" });
    }
    const bay = laNhom ? keys.map((key, j) => {
      const g = Math.PI * 2 * j / keys.length + Math.random() * .3, R = to * 0.95 + Math.random() * 90;
      const e = el("div", "sx-bay nho"); e.innerHTML = SAO; e.style.cssText = "width:34px;height:34px;margin:-17px 0 0 -17px;opacity:0"; man.appendChild(e);
      const ob = { el: e, key, x: cx + Math.cos(g) * R * 1.35, y: cy + Math.sin(g) * R * .8, co: 1.2 };
      hoatAnh(e, [{ transform: `translate(${cx}px,${cy}px) scale(0)`, opacity: 0 }, { transform: `translate(${ob.x}px,${ob.y}px) scale(1.2) rotate(90deg)`, opacity: 1 }],
        { duration: 700, delay: 500 + j * 25, easing: "cubic-bezier(.2,1.2,.4,1)", fill: "forwards" });
      return ob;
    }) : lon.map(ob => { ob.co = 1; return ob; });
    setTimeout(() => man.classList.add("mo"), 16);           // ⛔ không rAF: khung myActivity chạy ngầm đóng băng rAF
    let daXong = false;
    const ketThuc = () => { if (daXong) return; daXong = true; setTimeout(() => man.remove(), 300); if (xong) xong(); };
    setTimeout(ketThuc, (laNhom ? 2300 : 1700 + k * 110) + 2600 + keys.length * 50);
    setTimeout(() => {
      man.classList.remove("mo");
      if (laNhom) lon.forEach(ob => hoatAnh(ob.el, [{ opacity: 1, transform: `translate(${ob.x}px,${ob.y}px) scale(1)` }, { opacity: 0, transform: `translate(${ob.x}px,${ob.y}px) scale(1.6)` }], { duration: 380, fill: "forwards" }));
      let con = bay.length;
      const xongMot = () => { if (--con === 0) ketThuc(); };
      bay.forEach((ob, j) => {
        const v = avs.get(ob.key), a = v && v.av;
        if (!a || !a.isConnected) { ob.el.remove(); return xongMot(); }
        const b = a.getBoundingClientRect(), tx = b.left + b.width / 2, ty = b.top + b.height / 2;
        const mx = (ob.x + tx) / 2 + (phat ? -60 : 80), my = Math.min(ob.y, ty) - (laNhom ? 120 : 180);
        const sc = laNhom ? .75 : (b.width / to * 0.9);
        const an = hoatAnh(ob.el, [{ transform: `translate(${ob.x}px,${ob.y}px) scale(${ob.co}) rotate(${laNhom ? 90 : 0}deg)`, opacity: 1 },
          { transform: `translate(${mx}px,${my}px) scale(${laNhom ? .9 : .6}) rotate(220deg)`, opacity: 1, offset: .55 },
          { transform: `translate(${tx}px,${ty}px) scale(${sc}) rotate(420deg)`, opacity: .95 }],
        { duration: laNhom ? 760 : 820, delay: j * (laNhom ? 45 : 120), easing: "cubic-bezier(.55,0,.35,1)", fill: "forwards" });
        let xongRoi = false;
        const het = () => {
          if (xongRoi) return; xongRoi = true;
          ob.el.remove(); toeTia(tx, ty, phat);
          a.classList.remove("sx-av-nhan", "sx-av-phat"); void a.offsetWidth; a.classList.add(phat ? "sx-av-phat" : "sx-av-nhan");
          xongMot();
        };
        (an.finished || Promise.resolve()).then(het, het);
        setTimeout(het, (laNhom ? 760 : 820) + j * (laNhom ? 45 : 120) + 1500);   // lưới: khung chạy ngầm
      });
      if (!bay.length) ketThuc();
    }, laNhom ? 2300 : 1700 + k * 110);
  }

  // ---------- API cho buildPodium ----------
  napHet().then(() => veHet()).catch(() => { /* chưa đăng nhập: chỉ sao tạm */ });
  return {
    /** Podium dựng lại cả bảng (đổi phạm vi, listener về) ⇒ quên danh sách em cũ. */
    moiBang() { avs.clear(); },
    /** Podium dựng một thẻ: đăng ký quả avatar THẬT của em (đi suốt thẻ ⇄ bóng) để gắn huy hiệu sao. */
    ganAv(key, av, info) {
      avs.set(key, { av, ten: info.name, hang: info.rank, pct: info.pct });
      veMot(key);
    },
    /** Giữ thẻ tên / giữ quả bóng ⇒ pop-up một em. */
    giu(key, anchor) { moEm(key, anchor); },
    /** Cụm nút góc dưới phải: ⭐ · VÍ | myTeam. */
    congCu(host) {
      const box = el("div", "aw-psx-tools");
      const sao = el("button", "hq-sao-lop aw-psx-sao", SAO);
      sao.type = "button"; sao.title = "Thưởng / phạt sao cho đội hoặc cả lớp";
      sao.onclick = e => { e.stopPropagation(); if (MO && MO.el.classList.contains("lop")) return MO.dong(); moNhom(sao); };
      const vi = el("button", "hq-vi-sao aw-psx-vi", VI_IC + '<span class="sx-vi-dem" hidden></span>');
      vi.type = "button"; vi.title = "THƯỞNG VÀO VÍ — đưa sao tạm vào ví thật"; vi.disabled = true;
      vi.onclick = e => { e.stopPropagation(); if (MO) MO.dong(); hoiVi(false, null); };
      const vach = el("i", "aw-psx-vach");
      const team = el("button", "aw-psx-myteam", TEAM_IC + "<span>myTeam</span>");
      team.type = "button"; team.title = o.laTam ? "Lớp tạm không có trong myTeam" : "Đưa đội ở Podium này sang myTeam";
      if (o.laTam) team.disabled = true;
      team.onclick = e => { e.stopPropagation(); if (MO) MO.dong(); hoiMyTeam(); };
      box.append(sao, vi, vach, team);
      host.append(box);
      tools = { vi, dem: vi.querySelector(".sx-vi-dem"), team };
      capNhatVi();
      return box;
    },
    /** Đóng màn kết quả khi còn sao tạm ⇒ hỏi ĐƯA VÀO VÍ / HỦY BỎ. Trả true = đã chặn (sẽ gọi `dongThat` sau). */
    chanDong(dongThat) {
      if (MO) MO.dong();
      return hoiVi(true, () => dongThat());
    },
    coTam() { return dsTam().length > 0; },
    GIU_MS
  };
}
