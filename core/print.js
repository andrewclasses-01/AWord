// =============================================================
// PRINT — paper worksheets (100% English product). GENERIC across templates.
//
// Clicking the Print button opens a small popup to pick a print FORMAT:
//   Anagram · Crossword · Quiz · Unjumble · Word
// Which formats are offered depends on the activity type + question count:
//   • Anagram  — every template, any number of questions
//   • Quiz     — every template, any number of questions
//   • Crossword— 2..35 questions, every template EXCEPT "type-the-answer"
//   • Unjumble — only "type-the-answer", any number of questions
//   • Word     — only a "WORDS" act carrying clue-set variants (Đợt 145,
//                core/content-view.js) — a plain vocabulary TABLE, not a game
//                worksheet; it prints the clue set picked in the popup's
//                first step (Đợt 415), then asks WHICH CLASS (core/classes.js).
// Formats that don't apply simply don't show an icon.
//
// A format renders a printable sheet from a NORMALISED item list
// ({clue, answer, options}) that each template can provide via
// `template.toPrintItems(activity)` (falls back to quiz-shaped content).
// Output is pure grayscale (prints fine in black & white) and defaults to
// A4 via @page (see core/app.css). Double-sided is a printer-dialog choice
// the browser can't set from a web page — the popup notes this.
//
// CROSSWORD builds its OWN interlocking grid from the item answers
// (buildCrosswordGrid below) — deliberately a SEPARATE, smaller copy of
// templates/crossword/crossword.js's builder, not an import from it. This
// file is core (every template's Print button reaches it), and the crossword
// TEMPLATE module drags in its own editor/keyboard/voice/sound modules that
// no other template needs — importing from it here would pull all of that
// into core for every act, not just ones the teacher opens as Crossword. The
// print version also drops what only the live game needs: `src` identity
// (for "Start with mistakes" filtering) and the random shuffle/tie-break that
// varies the on-screen puzzle across "Start again" — a worksheet should print
// the SAME puzzle every time it's generated, so placement here is a stable
// longest-word-first sort with no randomness at all.
//
// WORD reads the RAW library act, not the resolved one — `openPrintPopup`'s
// second parameter (`libAct`). `resolveActivity()` (core/content-view.js)
// flattens a variant act's four clue sets down to whichever ONE is active
// before every other format ever sees it (so 17 templates never have to know
// variants exist) — exactly the data Word's ALL/ENG1/ENG2/VI1/VI2 picker
// needs is what that flattening throws away, so Word has to reach past it.
// =============================================================

import { getTemplate } from "./registry.js";
import { shuffle, el } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { variantsOf, clueOf, resolveActivity, activeVariant, variantLabel } from "./content-view.js";
import { dsLopDashboard, buoiTrongNgay, thuHoc, isoNgay, THU_VN } from "./lop-dashboard.js";
import { coQuest, rowsQuest, maBaiCua, KIEU_QUEST, MO_DAP_AN, dungTrangQuest, inTo, pdfTuTo, dayBaiCheck, dsBoDe, luuBoDe, themLopVaoBo, hatMoi, laThietBiChamIOS, taiSan, daSan, chiaSe, moQr } from "./print-quest.js";

const FORMAT_META = {
  anagram:   { label: "Anagram",   icon: icons.fmtAnagram },
  crossword: { label: "Crossword", icon: icons.fmtCrossword },
  quiz:      { label: "Quiz",      icon: icons.fmtQuiz },
  unjumble:  { label: "Unjumble",  icon: icons.fmtUnjumble },
  word:      { label: "Word",      icon: icons.fmtWord }
};
// Order shown in the popup (teacher's order): Anagram, Crossword, Quiz, Unjumble, Word.
const FORMAT_ORDER = ["anagram", "crossword", "quiz", "unjumble", "word"];

// Word's clue-set choice is now made in the popup's FIRST step (Đợt 415,
// showVariantStep in openPrintPopup) — "all" = eng1 + vi2 side by side,
// otherwise one of the act's own variant keys (variantsOf()).

// ---------- public entry (called by core/engine.js Print button) ----------
// `libAct` (optional, defaults to `activity`) is the RAW library act, needed
// only by the Word format — see the file-header comment above. Every other
// format keeps reading `activity` (already resolved to one clue set), so
// they see zero change from this parameter existing.
//
// ⭐ Đợt 415 (thầy, 27/9/2026) — CHỌN BỘ TRƯỚC, ĐỊNH DẠNG SAU. Act có bộ gợi ý
// (ENG1/ENG2/VI1/VI2) mở popup ở bước "which set?" trước tiên; chọn xong mới
// tới Anagram/Quiz/…, và định dạng đó in ĐÚNG bộ vừa chọn (không còn phụ thuộc
// bộ đang bật trong Options). ALL chỉ có nghĩa với Word nên bấm ALL đi thẳng
// sang bước chọn lớp. Act không có bộ gợi ý → vào thẳng bước định dạng như cũ.
//   `variantAct`     — act mang các bộ gợi ý (mặc định `libAct`; engine truyền
//                      act GỐC khi đang chơi bản đã đổi template, vì bản đổi
//                      đó đã bị nướng phẳng còn 1 bộ).
//   `resolveVariant` — key → (Promise) activity đã phẳng về đúng bộ đó, cùng
//                      template với `activity` (mặc định: resolveActivity).
// ⭐⭐ Đợt 435 (thầy chốt 01/10/2026, mẫu v5 `D:\OTHERS\CLAUDE\AWord - thiet ke in quest\mau-v5-quest.html`) —
// MÀN CHỌN IN MỘT MÀN, thay 3 bước nối nhau (bộ → dạng → lớp) của Đợt 415:
//   · Đầu hộp: BỘ NGHĨA (ENG1/ENG2/VI1/VI2/ALL) cùng hàng tiêu đề — mở lên CHƯA chọn bộ nào, nút IN khoá tới khi chọn.
//   · DẠNG IN hai khu: CƠ BẢN (2×2 Anagram · Quiz · Crossword · Word, + Unjumble cho type-the-answer)
//     và QUEST (Translation trên, Logic dưới — core/print-quest.js), thẻ có hình thu nhỏ trang giấy.
//   · LỚP + NGÀY in trên đầu trang: lớp đọc từ DASHBOARD (core/lop-dashboard.js), 2 lớp HÔM NAY lên đầu, xanh lá.
//   · Dạng QUEST: BỘ ĐỀ (cặp bản học sinh + bài check cùng hạt xáo, mã LQ-n / TQ-n) — máy tính: đúp = in lại
//     đúng bộ; iPad/iPhone: chạm = chọn + tải sẵn bài check, đúp = hộp Chia sẻ (Notability). Nút QR nhỏ mỗi ô.
//   · Công tắc "Bài check" (bật sẵn): in bộ mới thì dựng PDF bài check đẩy lên kho.
//   · Cột phải: XEM TRƯỚC trang in thật (dạng Quest) + số trang + nút IN.
// Dạng cơ bản vẫn in bằng runPrint/runPrintWord cũ y nguyên — màn này chỉ đổi cách CHỌN.
export function openPrintPopup(activity, libAct = activity, { variantAct = null, resolveVariant = null } = {}) {
  const vAct = variantAct || libAct;
  const variants = variantsOf(vAct && vAct.content) || [];
  const hasWord = variants.length > 0 && wordRowsOf(vAct).length > 0;
  const resolveFor = resolveVariant || (key => resolveActivity(withVariant(libAct, key)));
  const coBan = eligibleFormats(activity, vAct);
  const quest = variants.length && coQuest(vAct) ? ["trans", "logic"] : [];
  const maBai = maBaiCua(vAct);
  const laIOS = laThietBiChamIOS();
  napFontIn();

  const st = {
    dang: quest.length ? "logic" : (coBan[0] || ""),
    bo: variants.length ? "" : "-",            // "-" = act không có bộ nghĩa (không cần chọn)
    lop: "", lopDs: null, ngay: homNayVN(),
    boDe: {}, boDeLoi: {}, boChon: {}, seedMoi: { logic: hatMoi(), trans: hatMoi() },
    check: true, dangIn: false, san: {}, bam: null, xemLuot: 0
  };

  const overlay = el("div", "aw-print-pop-overlay");
  const box = el("div", "aw-pq");
  overlay.append(box);
  let nhanNen = false;
  overlay.addEventListener("mousedown", ev => { nhanNen = ev.target === overlay; });
  overlay.addEventListener("click", ev => { if (ev.target === overlay && nhanNen) close(); });
  document.body.append(overlay);
  document.addEventListener("keydown", onEsc);
  function onEsc(ev) { if (ev.key === "Escape" && !document.querySelector(".aw-qp-qr")) close(); }
  function close() { overlay.remove(); document.removeEventListener("keydown", onEsc); document.removeEventListener("click", dongDsLop, true); }
  function dongDsLop(ev) { if (!ev.target.closest(".aw-pq-lop")) box.querySelector(".aw-pq-lop")?.classList.remove("is-open"); }
  document.addEventListener("click", dongDsLop, true);

  const nSo = variants.length ? wordRowsOf(vAct).length : extractItems(activity).length;
  box.innerHTML = `
    <div class="aw-pq-trai">
      <div class="aw-pq-dau">
        <span class="aw-pq-ic">${IC_IN}</span>
        <div class="aw-pq-tde"><h3>In bài tập giấy</h3><p>${escapeHtml(vAct.title || "")} · ${nSo} ${variants.length ? "từ" : "câu"} · A4 trắng đen</p></div>
        <div class="aw-pq-bo"></div>
        <button type="button" class="aw-pq-dong" title="Đóng">${IC_X}</button>
      </div>
      <div class="aw-pq-muc">DẠNG IN</div>
      <div class="aw-pq-dangkhu${quest.length ? "" : " is-motkhu"}">
        <div><div class="aw-pq-nhom">CƠ BẢN</div><div class="aw-pq-luoi aw-pq-luoi-cb"></div></div>
        ${quest.length ? `<div class="aw-pq-q"><div class="aw-pq-nhom">QUEST</div><div class="aw-pq-luoi aw-pq-luoi-q"></div></div>` : ""}
      </div>
      <div class="aw-pq-muc">LỚP · NGÀY IN TRÊN ĐẦU TRANG</div>
      <div class="aw-pq-hanglop">
        <div class="aw-pq-lop"><button type="button" class="aw-pq-nutlop"></button><div class="aw-pq-dslop"></div></div>
        <label class="aw-pq-ngay" title="Đổi ngày in">${IC_LICH}<span class="aw-pq-ngaychu"></span><input type="date" tabindex="-1" aria-label="Ngày in"></label>
      </div>
      <div class="aw-pq-khubo">
        <div class="aw-pq-muc">BỘ ĐỀ <span class="aw-pq-muc-phu">cặp bản học sinh + bài check, cùng thứ tự xáo</span></div>
        <div class="aw-pq-bode"></div>
        <div class="aw-pq-nhac"></div>
      </div>
      <button type="button" class="aw-pq-check" role="switch"><span class="aw-pq-congtac"></span>
        <span><b>Bài check</b><span>Bản cho thầy, cùng thứ tự với bộ đề · tự lưu lên kho · mở trên iPad/iPhone</span></span></button>
    </div>
    <div class="aw-pq-phai">
      <div class="aw-pq-muc">XEM TRƯỚC</div>
      <div class="aw-pq-xem"></div>
      <div class="aw-pq-tomtat"></div>
      <button type="button" class="aw-pq-in">${IC_IN}IN</button>
      <div class="aw-pq-inphu">Hộp in của máy mở ra — chọn <b>In 2 mặt</b></div>
    </div>`;
  const $ = (s) => box.querySelector(s);
  $(".aw-pq-dong").onclick = close;
  // Đợt 436 (thầy 01/10): ô ngày hiện kiểu VIỆT NAM dd/mm/yyyy — ô <input type=date> của trình duyệt theo ngôn ngữ máy
  // (Chrome tiếng Anh hiện 10/01/2026 = tháng/ngày) ⇒ ô gốc ẩn trong suốt phủ kín, chữ hiện là ngayVN(); bấm = mở lịch.
  const oNgay = $(".aw-pq-ngay input");
  const veNgay = () => { $(".aw-pq-ngaychu").textContent = ngayVN(st.ngay); };
  oNgay.value = st.ngay; veNgay();
  oNgay.onchange = (e) => { st.ngay = e.target.value || homNayVN(); veNgay(); veXem(); };
  $(".aw-pq-ngay").addEventListener("click", (e) => { e.preventDefault(); try { oNgay.showPicker(); } catch { oNgay.focus(); } });
  $(".aw-pq-check").onclick = () => { st.check = !st.check; ve(); };
  $(".aw-pq-in").onclick = () => { sound.click(); void bamIn(); };
  $(".aw-pq-nutlop").onclick = () => $(".aw-pq-lop").classList.toggle("is-open");

  // ---- lớp từ dashboard ----
  dsLopDashboard().then(({ lop }) => {
    const hn = new Date();
    const ds = lop.map(c => ({ ma: c.maLop, ten: c.ten, laKhoa: c.laKhoa, buoi: buoiTrongNgay(c.lich, hn), thu: thuHoc(c.lich, hn) }));
    const homNay = ds.filter(c => c.buoi).sort((a, b) => a.buoi.vao.localeCompare(b.buoi.vao));
    const gio = String(hn.getHours()).padStart(2, "0") + ":" + String(hn.getMinutes()).padStart(2, "0");
    const dangHoc = homNay.find(c => (c.buoi.tan || "99:99") >= gio) || homNay[homNay.length - 1];
    st.lopDs = { homNay, khac: ds.filter(c => !c.buoi) };
    if (!st.lop && dangHoc) st.lop = dangHoc.ma;
    veLop(); veXem();
  }).catch(e => { console.warn("AWord: print could not read dashboard classes", e); st.lopDs = { homNay: [], khac: [], loi: true }; veLop(); });

  function laQuest(d = st.dang) { return d === "logic" || d === "trans"; }
  function thieu() {
    if (!st.dang) return "Act này chưa có câu nào để in.";
    if (!st.bo) return "Chọn BỘ NGHĨA ở góc trên";
    if (st.bo === "all" && st.dang !== "word") return "ALL chỉ dùng cho dạng Word — chọn một bộ nghĩa";
    return "";
  }

  function ve() {
    // bộ nghĩa
    const boDau = $(".aw-pq-bo");
    boDau.innerHTML = variants.length ? `<span class="aw-pq-nhanbo">BỘ NGHĨA</span>` : "";
    boDau.classList.toggle("is-can", !st.bo);
    (hasWord ? variants.concat("all") : variants).forEach(k => {
      const b = el("button", "aw-pq-vb" + (st.bo === k ? " is-on" : ""), k === "all" ? "ALL" : escapeHtml(variantLabel(vAct.content, k)));
      b.type = "button";
      b.onclick = () => { sound.click(); st.bo = k; if (laQuest()) st.boChon[st.dang] = null; ve(); };
      boDau.append(b);
    });
    // dạng in
    const the = (k) => {
      const d = DANG_IN[k];
      const b = el("button", "aw-pq-dang" + (st.dang === k ? " is-on" : ""),
        (d.moi ? `<span class="aw-pq-moi">MỚI</span>` : "") + `<span class="aw-pq-tich">${IC_TICH}</span>`
        + `<span class="aw-pq-nho">${d.nho}</span><span class="aw-pq-chu"><span class="aw-pq-ten">${d.ten}</span><span class="aw-pq-mota">${d.mo}</span></span>`);
      b.type = "button";
      b.onclick = () => { sound.click(); st.dang = k; ve(); };
      return b;
    };
    const cb = $(".aw-pq-luoi-cb"); cb.innerHTML = "";
    ["anagram", "quiz", "crossword", "word", "unjumble"].filter(k => coBan.includes(k)).forEach(k => cb.append(the(k)));
    if (!cb.children.length) cb.append(el("div", "aw-pq-trong", "Thêm câu hỏi trước rồi mới in được."));
    const q = $(".aw-pq-luoi-q"); if (q) { q.innerHTML = ""; quest.forEach(k => q.append(the(k))); }
    $(".aw-pq-check").classList.toggle("is-on", st.check);
    $(".aw-pq-check").setAttribute("aria-checked", String(st.check));
    $(".aw-pq-check").style.display = laQuest() ? "" : "none";
    $(".aw-pq-khubo").style.display = laQuest() ? "" : "none";
    veLop();
    if (laQuest()) { veBoDe(); if (!st.boDe[st.dang] && !st.boDeLoi[st.dang]) void napBoDe(st.dang); }
    veXem();
  }

  function veLop() {
    const nut = $(".aw-pq-nutlop"), ds = $(".aw-pq-dslop");
    const L = st.lopDs;
    const hn = L && L.homNay.find(c => c.ma === st.lop);
    nut.innerHTML = (hn ? `<span class="aw-pq-cham"></span>` : "")
      + `<span class="aw-pq-lopten">${escapeHtml(st.lop || (L ? "Không ghi lớp" : "Đang đọc lớp…"))}</span>`
      + (hn ? `<span class="aw-pq-lopphu">hôm nay · ${hn.buoi.vao}</span>` : "") + `<span class="aw-pq-mui">▾</span>`;
    if (!L) { ds.innerHTML = ""; return; }
    const d = new Date();
    const dong = (c, laHn) => `<div class="aw-pq-l${laHn ? " is-hn" : ""}${st.lop === c.ma ? " is-on" : ""}" data-lop="${escapeHtml(c.ma)}">${escapeHtml(c.ma)}`
      + (laHn ? `<span class="aw-pq-gio">${c.buoi.vao}</span>` : `<span class="aw-pq-gio2">${c.laKhoa ? "khóa học" : escapeHtml(c.thu)}</span>`) + `</div>`;
    ds.innerHTML = (L.homNay.length ? `<div class="aw-pq-lnhom is-hn">HÔM NAY · ${THU_VN[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}</div>` + L.homNay.map(c => dong(c, true)).join("") + `<div class="aw-pq-chia"></div>` : "")
      + (L.khac.length ? `<div class="aw-pq-lnhom">CÁC LỚP KHÁC</div>` + L.khac.map(c => dong(c, false)).join("") + `<div class="aw-pq-chia"></div>` : "")
      + `<div class="aw-pq-l aw-pq-l-khong${!st.lop ? " is-on" : ""}" data-lop="">Không ghi lớp</div>`
      + `<div class="aw-pq-nguon">${L.loi ? "Không đọc được lớp của dashboard" : "Lớp + lịch đọc từ lịch tuần trên dashboard"}</div>`;
    ds.querySelectorAll("[data-lop]").forEach(x => x.onclick = () => {
      st.lop = x.dataset.lop; $(".aw-pq-lop").classList.remove("is-open"); veLop(); veXem();
    });
  }

  // ---- bộ đề ----
  async function napBoDe(kieu) {
    try { st.boDe[kieu] = await dsBoDe(vAct, kieu); delete st.boDeLoi[kieu]; }
    catch (e) { console.warn("AWord: could not read print sets", e); st.boDe[kieu] = []; st.boDeLoi[kieu] = (e && e.code) || "loi"; }
    if (overlay.isConnected && st.dang === kieu) { veBoDe(); veXem(); }
  }
  const boDangChon = () => {
    const id = st.boChon[st.dang];
    return id ? (st.boDe[st.dang] || []).find(b => b.id === id) || null : null;
  };
  function maMoi(kieu) {
    const ds = st.boDe[kieu] || [];
    return KIEU_QUEST[kieu].tien + "-" + (ds.reduce((m, b) => Math.max(m, b.so || 0), 0) + 1);
  }
  function veBoDe() {
    const host = $(".aw-pq-bode"); host.innerHTML = "";
    const ds = st.boDe[st.dang];
    const chon = boDangChon();
    if (!ds) host.append(el("div", "aw-pq-trong", "Đang đọc bộ đề…"));
    (ds || []).forEach((b, i) => {
      const san = laIOS && b.pdf ? (daSan(b.pdf) ? `<span class="aw-pq-san">● sẵn sàng — chạm đúp để chia sẻ</span>` : st.san[b.id] === "dang" ? `<span class="aw-pq-dangtai">đang tải sẵn…</span>` : "") : "";
      const o = el("div", "aw-pq-bo1" + (chon && chon.id === b.id ? " is-on" : ""),
        `<b>${escapeHtml(b.ma)}${i === 0 ? " · mới nhất" : ""}</b><span>${escapeHtml(b.ngayTao || "")} · ${escapeHtml(String(b.bo || "").toUpperCase())}${b.lop && b.lop.length ? " · đã in: " + escapeHtml(b.lop.join(", ")) : ""}</span>`
        + (b.pdf ? "" : `<span class="aw-pq-chuacheck">chưa có bài check</span>`) + san
        + `<span class="aw-pq-qr" title="Mã QR + link bài check">${IC_QR}</span>`);
      o.onclick = (e) => {
        if (e.target.closest(".aw-pq-qr")) {
          e.stopPropagation();
          if (b.pdf) moQr(b.pdf, "Bài check " + b.ma); else baoLoi("Bộ " + b.ma + " chưa có bài check.");
          return;
        }
        // ⛔ cú bấm 1 VẼ LẠI ô ⇒ `dblclick` không bao giờ tới ô mới ⇒ TỰ ĐẾM 2 cú bấm cùng ô trong 450 ms
        const luc = performance.now();
        if (st.bam && st.bam.id === b.id && luc - st.bam.t < 450) { st.bam = null; dupBo(b); return; }
        st.bam = { id: b.id, t: luc };
        st.boChon[st.dang] = b.id;
        if (b.bo && variants.includes(b.bo)) st.bo = b.bo;          // bộ cũ in đúng bộ nghĩa lúc tạo
        if (laIOS && b.pdf && !daSan(b.pdf)) {
          st.san[b.id] = "dang";
          taiSan(b.pdf).then(() => { st.san[b.id] = "xong"; }, e2 => { st.san[b.id] = ""; baoLoi(e2.message); })
            .finally(() => { if (overlay.isConnected) veBoDe(); });
        }
        ve();
      };
      host.append(o);
    });
    if (ds) {
      const moi = el("button", "aw-pq-bo1 aw-pq-bomoi" + (!chon ? " is-on" : ""), `<b>+ Bộ mới · ${maMoi(st.dang)}</b><span>xáo thứ tự mới</span>`);
      moi.type = "button";
      moi.onclick = () => {
        if (!st.boChon[st.dang]) st.seedMoi[st.dang] = hatMoi();   // đang ở "bộ mới" mà bấm lại = xáo lần khác
        st.boChon[st.dang] = null; ve();
      };
      host.append(moi);
    }
    $(".aw-pq-nhac").innerHTML = st.boDeLoi[st.dang]
      ? `<span class="aw-pq-loi">Chưa đọc được kho bộ đề (${escapeHtml(st.boDeLoi[st.dang])}) — vẫn in được, nhưng bộ này không được lưu.</span>`
      : laIOS ? "<b>iPad</b>: chạm = chọn + tải sẵn bài check · chạm đúp = hộp Chia sẻ → Notability · nút QR = mã QR + link"
        : "<b>Máy tính</b>: bấm = chọn · đúp = in lại đúng bộ đó · nút QR = mã QR + link. Lớp khác dùng chung một bộ cũng được.";
  }
  function dupBo(b) {
    if (laIOS) {
      if (!b.pdf) { baoLoi("Bộ " + b.ma + " chưa có bài check."); return; }
      chiaSe(b.pdf, `${maBai} - ${b.ma} ${KIEU_QUEST[b.kieu].ten} - BAI CHECK.pdf`).catch(e => { if (e && e.name !== "AbortError") baoLoi(e.message); });
      return;
    }
    st.boChon[st.dang] = b.id;
    if (b.bo && variants.includes(b.bo)) st.bo = b.bo;
    ve();
    void bamIn();
  }

  // ---- dữ liệu một lần in Quest (bộ đang chọn hoặc bộ mới) ----
  function goiQuest(laCheck) {
    const b = boDangChon();
    const kieu = st.dang;
    return {
      b, kieu,
      o: {
        maBai, laCheck, mo: MO_DAP_AN,
        lop: laCheck ? "" : st.lop,
        ngay: laCheck ? ((b && b.ngayTao) || ngayVN(homNayVN())) : ngayVN(st.ngay),
        maBo: b ? b.ma : maMoi(kieu),
        items: b ? b.items : rowsQuest(vAct, st.bo),
        seed: b ? b.seed : st.seedMoi[kieu]
      }
    };
  }

  // ---- xem trước ----
  async function veXem() {
    const luot = ++st.xemLuot;
    const xem = $(".aw-pq-xem"), tt = $(".aw-pq-tomtat"), nut = $(".aw-pq-in");
    const loi = thieu();
    nut.disabled = !!loi || st.dangIn;
    if (loi) { xem.innerHTML = `<div class="aw-pq-cho">${escapeHtml(loi)}</div>`; tt.innerHTML = ""; return; }
    if (!laQuest()) {
      xem.innerHTML = `<div class="aw-pq-xemcu"><span class="aw-pq-nho aw-pq-nho-to">${DANG_IN[st.dang].nho}</span></div>`;
      tt.innerHTML = `<span class="aw-pq-ok">${DANG_IN[st.dang].ten}</span><span class="aw-pq-phu">tự giãn cho đủ số trang chẵn, in 2 mặt</span>`;
      return;
    }
    if (!st.boDe[st.dang] && !st.boDeLoi[st.dang]) { xem.innerHTML = `<div class="aw-pq-cho">Đang đọc bộ đề…</div>`; tt.innerHTML = ""; return; }
    const { o, kieu } = goiQuest(false);
    if (!o.items.length) { xem.innerHTML = `<div class="aw-pq-cho">Bộ nghĩa này chưa có nội dung.</div>`; tt.innerHTML = ""; nut.disabled = true; return; }
    const kq = await dungTrangQuest(kieu, o);
    if (luot !== st.xemLuot || !overlay.isConnected) return;
    xem.innerHTML = "";
    const k = 150 / (210 * 96 / 25.4);
    [...kq.sheet.querySelectorAll(".aw-qp-trang")].slice(0, 2).forEach(tr => {
      const khung = el("div", "aw-pq-xemtrang");
      const thu = el("div", "aw-pq-thu");
      thu.style.transform = `scale(${k})`;
      thu.append(tr);
      khung.append(thu);
      xem.append(khung);
    });
    tt.innerHTML = `<span class="aw-pq-ok">${kq.soTrang} trang · in ${kq.soTrang / 2} tờ 2 mặt</span>`
      + `<span class="aw-pq-phu">${kq.tuNhien !== kq.soTrang ? `tự nhiên ${kq.tuNhien} trang → giãn đủ ${kq.soTrang}` : "vừa khít, đã nới hàng cho đầy trang"} · không câu nào bị cắt</span>`;
  }

  // ---- IN ----
  async function bamIn() {
    if (thieu() || st.dangIn) return;
    if (!laQuest()) {
      const lopIn = st.lop;
      if (st.dang === "word") { close(); void runPrintWord(vAct, st.bo, lopIn, ngayVN(st.ngay)); return; }
      let cur = activity;
      if (variants.length) {
        st.dangIn = true; veXem();
        try { cur = await resolveFor(st.bo); } catch (e) { console.warn("AWord: print could not load that set", e); cur = null; }
        st.dangIn = false;
        if (!overlay.isConnected) return;
        if (!cur) { baoLoi("Không nạp được bộ nghĩa này."); veXem(); return; }
      }
      const f = st.dang;
      close();
      void runPrint(cur, f);
      return;
    }
    st.dangIn = true; veXem();
    try {
      const { b, kieu, o } = goiQuest(false);
      let id = b ? b.id : "", bo = b;
      // bộ MỚI: lưu trước (để mã LQ-n in ở chân trang là mã thật); hỏng thì vẫn in, báo không lưu được
      if (!b && !st.boDeLoi[kieu]) {
        const so = Number(o.maBo.split("-").pop()) || 1;
        id = `a${vAct.id}-${kieu}-${so}`;
        bo = {
          actId: String(vAct.id || ""), actNum: vAct.num || null, actTen: vAct.title || "", maBai, kieu, so, ma: o.maBo,
          bo: st.bo, seed: o.seed, items: o.items, tao: Date.now(), ngayTao: ngayVN(homNayVN()),
          lop: st.lop ? [st.lop] : [], pdf: "", tep: "", soTrang: 0
        };
        try { await luuBoDe(id, bo); bo = { ...bo, id }; (st.boDe[kieu] = st.boDe[kieu] || []).unshift(bo); st.boChon[kieu] = id; st.seedMoi[kieu] = hatMoi(); }
        catch (e) { console.warn("AWord: could not save print set", e); baoLoi("Không lưu được bộ đề (" + ((e && e.code) || "lỗi") + ") — vẫn in."); id = ""; bo = null; }
      } else if (b && st.lop && !(b.lop || []).includes(st.lop)) {
        themLopVaoBo(b.id, st.lop).then(() => { b.lop = (b.lop || []).concat(st.lop); if (overlay.isConnected) veBoDe(); }, () => {});
      }
      const { sheet, soTrang } = await dungTrangQuest(kieu, o);
      inTo(sheet);
      // bài check: chỉ dựng khi bộ đã lưu + chưa có PDF (bộ cũ đã có thì thôi)
      if (st.check && id && bo && !bo.pdf) void lamBaiCheck(id, bo, soTrang);
    } finally {
      st.dangIn = false;
      if (overlay.isConnected) { veBoDe(); veXem(); }
    }
  }
  async function lamBaiCheck(id, bo, soTrang) {
    baoTin("Đang lưu bài check " + bo.ma + "…");
    try {
      const { sheet } = await dungTrangQuest(bo.kieu, { maBai, laCheck: true, mo: MO_DAP_AN, lop: "", ngay: bo.ngayTao, maBo: bo.ma, items: bo.items, seed: bo.seed });
      const blob = await pdfTuTo(sheet);
      const { url, tep } = await dayBaiCheck(blob, id + ".pdf");
      await luuBoDe(id, { pdf: url, tep, soTrang });
      bo.pdf = url; bo.tep = tep; bo.soTrang = soTrang;
      const x = (st.boDe[bo.kieu] || []).find(y => y.id === id); if (x) Object.assign(x, { pdf: url, tep, soTrang });
      baoTin("Đã lưu bài check " + bo.ma + " — bấm nút QR ở ô bộ đề để mở trên iPad.");
      if (overlay.isConnected) veBoDe();
    } catch (e) {
      console.warn("AWord: answer-check PDF failed", e);
      baoLoi("Không lưu được bài check " + bo.ma + ": " + (((e && e.code) || (e && e.message)) || "lỗi"));
    }
  }
  ve();   // cuối hàm: mọi hàm/hằng ở trên đã khởi tạo (tránh TDZ)
}

// ---------- phụ trợ màn in (Đợt 435) ----------
const IC_IN = `<svg viewBox="0 0 24 24"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`;
const IC_X = `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const IC_TICH = `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`;
const IC_LICH = `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`;
const IC_QR = `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4z"/></svg>`;
const DANG_IN = {
  logic: { ten: "Logic Quest", mo: "Đọc mô tả, suy ra từ · word bank đầu bài", moi: true,
    nho: `<span class="bk"><i></i><i></i><i></i><i></i><i></i><i></i></span>` + `<span class="hang"><i></i><i></i><i></i></span>`.repeat(7) },
  trans: { ten: "Translation Quest", mo: "Mô tả tiếng Anh + dòng dịch · word bank đầu bài", moi: true,
    nho: `<span class="bk"><i></i><i></i><i></i><i></i><i></i><i></i></span>` + `<span class="hang2"><i></i><span class="c"><i></i><i></i></span><i></i></span>`.repeat(5) },
  word: { ten: "Word", mo: "Bảng từ · phiên âm · nghĩa",
    nho: `<i style="width:60%"></i>` + `<span class="tb"><i></i><i></i><i></i></span>`.repeat(9) },
  anagram: { ten: "Anagram", mo: "Chữ cái xáo + ô viết lại",
    nho: (`<i style="width:70%"></i><span class="o-chu"><i></i><i></i><i></i><i></i><i></i><i></i></span>`).repeat(4) },
  unjumble: { ten: "Unjumble", mo: "Chữ xáo trong câu + ô viết lại",
    nho: (`<i style="width:90%"></i><span class="o-chu"><i></i><i></i><i></i><i></i><i></i><i></i></span>`).repeat(4) },
  quiz: { ten: "Quiz", mo: "Câu hỏi + 4 lựa chọn A/B/C/D",
    nho: (`<i style="width:85%"></i><span class="ac"><i></i><i></i><i></i><i></i></span>`).repeat(4) },
  crossword: { ten: "Crossword", mo: "Ô chữ đan + gợi ý ngang/dọc",
    nho: `<span class="cw">` + Array.from({ length: 30 }, (_, i) => `<i class="${[1, 4, 7, 9, 14, 20, 22, 27].includes(i) ? "x" : ""}"></i>`).join("") + `</span><i></i><i style="width:80%"></i><i></i><i style="width:70%"></i>` }
};
// Hôm nay theo GIỜ VIỆT NAM (Asia/Ho_Chi_Minh), dạng yyyy-mm-dd — đúng cả khi máy đặt múi giờ khác.
function homNayVN() {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
  catch { return isoNgay(new Date()); }
}
const ngayVN = (iso) => { const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || ""); };
// Chữ trang Quest: Noto Sans (đủ tiếng Việt + ký hiệu phiên âm IPA — Baloo 2 thiếu IPA). Nạp một lần khi mở màn in.
function napFontIn() {
  if (document.getElementById("aw-font-noto")) return;
  const l = document.createElement("link");
  l.id = "aw-font-noto"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700&display=swap";
  document.head.append(l);
}
function hopTin(t, laLoi) {
  let h = document.querySelector(".aw-pq-tin");
  if (!h) { h = el("div", "aw-pq-tin"); document.body.append(h); }
  h.textContent = t; h.classList.toggle("is-loi", !!laLoi); h.classList.add("is-show");
  clearTimeout(h._t); h._t = setTimeout(() => h.classList.remove("is-show"), laLoi ? 5200 : 3200);
}
const baoTin = (t) => hopTin(t, false);
const baoLoi = (t) => hopTin(t, true);

// A copy of `act` set to play clue set `key` in TEXT mode — what
// resolveActivity() / convertActivity() need to flatten to exactly that set.
// `options` is copied, never mutated: Print must not change what the act plays.
export function withVariant(act, key) {
  return { ...act, options: { ...(act.options || {}), contentMode: "text", contentVariant: key } };
}

// ---------- eligibility ----------
function eligibleFormats(activity, libAct) {
  const n = extractItems(activity).length;
  const type = activity.type;
  const out = [];
  if (n >= 1) out.push("anagram");
  if (n >= 2 && n <= 35 && type !== "type-the-answer") out.push("crossword");
  if (n >= 1) out.push("quiz");
  if (type === "type-the-answer" && n >= 1) out.push("unjumble");
  if (variantsOf(libAct && libAct.content) && wordRowsOf(libAct).length) out.push("word");
  // keep the fixed display order
  return FORMAT_ORDER.filter(f => out.includes(f));
}

// ---------- Word format: normalise the RAW act -> [{word, ipa, clues}] ----------
function wordRowsOf(libAct) {
  const items = (libAct && libAct.content && libAct.content.items) || [];
  return items.filter(it => it && it.word);
}

// ---------- normalise activity -> [{clue, answer, options}] ----------
function extractItems(activity) {
  let tpl = null;
  try { tpl = getTemplate(activity.type); } catch { tpl = null; }
  if (tpl && typeof tpl.toPrintItems === "function") {
    return (tpl.toPrintItems(activity) || []).filter(it => it && (it.clue || it.answer));
  }
  // default: quiz-shaped content (question + answers[] with one correct)
  const qs = activity.content?.questions || [];
  return qs
    .filter(q => q && Array.isArray(q.answers) && q.answers.length > 0)
    .map(q => ({
      clue: q.question || "",
      answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
      options: q.answers.map(a => ({ text: a.text, correct: !!a.correct }))
    }));
}

// ---------- PAGE-FIT: land on a full, EVEN sheet count for duplex printers ----------
// Pure CSS multi-column fragmentation (see core/app.css) has no notion of a
// TARGET page count — the browser just flows content and starts new
// pages/columns as needed. To land on an even sheet count (so a duplex
// printer never leaves a blank back side, and a barely-used trailing page
// never looks sparse) we do what templates/running-word/rw-print.js already
// does for its own worksheet (Đợt 193/203 there): MEASURE the real rendered
// height first, then pick a small size scale (--pf-scale, ±8%/+15% — thầy
// chốt "vừa phải") that nudges the content to a full even page count, and
// only if that's reachable within the bound — otherwise keep the natural
// (possibly odd) page count untouched (thầy chốt: đừng ép bằng mọi giá).
const PF_CONTENT_W_MM = 186;   // A4 minus this sheet's @page side margins (12mm×2)
const PF_CONTENT_H_MM = 267;   // A4 minus this sheet's @page top/bottom margins (16+14mm)
const PF_COL_GAP_MM = 11;      // matches .aw-print-body column-gap
const PF_COL_W_MM = (PF_CONTENT_W_MM - PF_COL_GAP_MM) / 2;
const MM_PX = 96 / 25.4;       // CSS spec: 1mm = 96/25.4px, true on screen AND on paper
const FIT_SHRINK_MAX = 0.08;   // co tối đa 8%
const FIT_GROW_MAX = 0.15;     // giãn tối đa 15%
const FIT_GOOD_FILL = 0.75;    // trang cuối đã đầy ≥75% thì khỏi giãn thêm
const FIT_ITERS = 6;           // đủ mịn trong biên ±8%/+15% (~0.3% mỗi bước cuối)
// Phải khớp font-family thật của .aw-print-sheet lúc in (core/app.css) — nếu
// không phép đo lấy nhầm font mặc định của app, metrics khác thì chiều cao đo sai.
const PRINT_FONT = `"Baloo 2", "Segoe UI", Arial, sans-serif`;

// Greedy pack: cột 1 đầy mới sang cột 2, cột 2 đầy mới sang trang mới — đúng
// quy tắc CSS Multi-column khi phân trang (chỉ CỤM CUỐI mới "balance", mọi
// trang trước fill tuần tự), nên số trang tính ra khớp bản in thật của Chrome.
// PURE + EXPORT + quét toàn dải giá trị (luật "chia/xếp" ở
// core/HUONG DAN CORE.md mục 19) — bàn thử: scratch/print-pagefit-test.mjs.
export function packPages(heightsPx, capacityPx, colsPerPage = 2) {
  let pages = 1, col = 0, colUsed = 0, pageUsed = 0, lastPageUsed = 0;
  for (const h of heightsPx) {
    if (colUsed > 0 && colUsed + h > capacityPx) {
      if (col < colsPerPage - 1) { col++; colUsed = 0; }
      else { pages++; col = 0; colUsed = 0; pageUsed = 0; }
    }
    colUsed += h;
    pageUsed += h;
    lastPageUsed = pageUsed;
  }
  return { pages, fillRatio: lastPageUsed / (capacityPx * colsPerPage) };
}

// Chọn --pf-scale trong biên [1-FIT_SHRINK_MAX, 1+FIT_GROW_MAX]:
//  - số trang tự nhiên LẺ (>1) và co được về số chẵn liền dưới trong biên → NÉN.
//  - số trang tự nhiên đã chẵn (hoặc chỉ 1) nhưng trang cuối còn trống nhiều → GIÃN,
//    chỉ tới mức KHÔNG đẻ thêm trang mới.
//  - không đạt trong biên (co lẫn giãn) → giữ nguyên tự nhiên.
// measureFn(scale) đo THẬT bằng DOM (measureFlow/measureBlock bên dưới) — đúng
// tinh thần "ĐO, KHÔNG ĐOÁN" của rw-print.js Đợt 203, không suy luận tuyến tính
// vì đổi cỡ chữ có thể làm câu XUỐNG DÒNG THÊM (bước nhảy, không tuyến tính).
export function resolveFitScale(measureFn, colsPerPage = 2) {
  const capacityPx = PF_CONTENT_H_MM * MM_PX;
  const pagesAt = s => packPages(measureFn(s), capacityPx, colsPerPage);
  const natural = pagesAt(1);
  if (natural.pages < 1) return 1;

  if (natural.pages > 1 && natural.pages % 2 === 1) {
    const target = natural.pages - 1;
    if (pagesAt(1 - FIT_SHRINK_MAX).pages <= target) {
      let lo = 1 - FIT_SHRINK_MAX, hi = 1;
      for (let i = 0; i < FIT_ITERS; i++) {
        const mid = (lo + hi) / 2;
        if (pagesAt(mid).pages <= target) lo = mid; else hi = mid;
      }
      return lo;
    }
    // Nén không đạt (vượt biên 8%) -> rơi xuống nhánh giãn bên dưới để ít
    // nhất lấp trang cuối cho đỡ trống, vẫn giữ nguyên số trang lẻ tự nhiên.
  }

  if (natural.fillRatio >= FIT_GOOD_FILL) return 1;
  const target = natural.pages;
  if (pagesAt(1 + FIT_GROW_MAX).pages <= target) return 1 + FIT_GROW_MAX;
  let lo = 1, hi = 1 + FIT_GROW_MAX;
  for (let i = 0; i < FIT_ITERS; i++) {
    const mid = (lo + hi) / 2;
    if (pagesAt(mid).pages <= target) lo = mid; else hi = mid;
  }
  return lo;
}

// Đo chiều cao thật từng câu (Anagram/Quiz/Unjumble) ở một --pf-scale, dựng
// trong bản dò ẩn NGOÀI màn hình — bề ngang đúng bằng 1 CỘT thật (PF_COL_W_MM)
// vì mỗi câu luôn nằm trọn trong 1 cột (break-inside:avoid), không phụ thuộc
// tổng có bao nhiêu cột/trang.
function measureFlow(itemEls, scale) {
  const probe = el("div", "aw-print-sheet");
  probe.style.cssText = `position:fixed; left:-99999px; top:0; visibility:hidden; display:block; font-family:${PRINT_FONT};`;
  probe.style.setProperty("--pf-scale", String(scale));
  const wrap = el("div", "aw-print-body");
  wrap.style.cssText = `column-count:1; width:${PF_COL_W_MM}mm;`;
  itemEls.forEach(src => wrap.append(src.cloneNode(true)));
  probe.append(wrap);
  document.body.append(probe);
  const heights = Array.from(wrap.children).map(c =>
    c.getBoundingClientRect().height + parseFloat(getComputedStyle(c).marginBottom || "0"));
  probe.remove();
  return heights;
}

// Đo chiều cao thật của MỘT khối liền (Crossword: lưới + 2 cột chú thích
// không tách cột như 3 định dạng kia) ở đúng bề ngang 1 trang.
function measureBlock(node, widthMm) {
  const probe = el("div", "aw-print-sheet");
  probe.style.cssText = `position:fixed; left:-99999px; top:0; visibility:hidden; display:block; font-family:${PRINT_FONT}; width:${widthMm}mm;`;
  probe.append(node);
  document.body.append(probe);
  const h = node.getBoundingClientRect().height;
  probe.remove();
  return h;
}

// ---------- run one format ----------
async function runPrint(activity, format) {
  const items = extractItems(activity);
  const pool = items.map(i => i.answer).filter(Boolean);
  let body, scale = 1;
  if (format === "anagram") body = renderAnagram(items);
  else if (format === "quiz") body = renderQuiz(items, pool);
  else if (format === "unjumble") body = renderUnjumble(items);
  else if (format === "crossword") body = renderCrossword(items);
  else return;

  // PAGE-FIT đo chiều cao thật bằng font-family thật (PRINT_FONT) — nếu
  // "Baloo 2" (font-display:swap, @font-face trong app.css) chưa tải xong,
  // phép đo lấy nhầm metrics của font dự phòng và tính sai số trang. Hầu như
  // không bao giờ xảy ra thật (nút Print chỉ bấm được sau khi cả app đã hiện
  // ra, tức font gần như chắc chắn đã tải) nhưng đợi cho chắc, gần như miễn phí.
  await document.fonts.ready;

  // PAGE-FIT: nhắm số trang chẵn (đầy tờ, hợp máy in 2 mặt) — xem khối "PAGE-FIT" ở trên.
  if (format === "crossword") {
    if (body.querySelector(".aw-pf-cw-grid")) {
      scale = resolveFitScale(s => [measureBlock(renderCrossword(items, s), PF_CONTENT_W_MM)], 1);
      if (scale !== 1) body = renderCrossword(items, scale);
    }
  } else {
    const itemEls = Array.from(body.children);
    if (itemEls.length) scale = resolveFitScale(s => measureFlow(itemEls, s), 2);
  }

  const sheet = buildSheet(activity, body, format);
  sheet.style.setProperty("--pf-scale", String(scale));
  finishAndPrint(sheet);
}

// ---------- Word format: a plain vocabulary TABLE, not a game worksheet ----
// `variantKey` is "all" or one of the act's variant keys ("eng1"/"eng2"/"vi1"/"vi2");
// `className` is whatever showClassStep() got back from the picker ("" for
// "(No class)"). Shares the exact same PAGE-FIT machinery as the other 3
// flowing formats (measureFlow/resolveFitScale/packPages) by shaping each
// word row as an ordinary `.aw-print-item` — runPrint() never has to know
// Word exists in order for that to keep working.
async function runPrintWord(libAct, variantKey, className, ngayIn) {
  const rows = wordRowsOf(libAct);
  if (!rows.length) return;
  const isAll = variantKey === "all";
  const cols = isAll ? ["eng1", "vi2"] : [variantKey];
  const body = renderWord(rows, cols, isAll);

  await document.fonts.ready; // same font-metrics safety net as runPrint() — see there

  const itemEls = Array.from(body.children);
  const scale = itemEls.length ? resolveFitScale(s => measureFlow(itemEls, s), 2) : 1;

  const topRight = (ngayIn || formatDateVN(new Date())) + (className ? "   •   " + className : "");
  const sheet = buildSheet(libAct, body, "word", topRight);
  sheet.style.setProperty("--pf-scale", String(scale));
  finishAndPrint(sheet);
}

function finishAndPrint(sheet) {
  document.body.append(sheet);
  // Remove the sheet once the print dialog closes (whether printed or
  // cancelled). afterprint + a long fallback per the core animate/callback rule.
  let done = false;
  const cleanup = () => { if (done) return; done = true; sheet.remove(); window.removeEventListener("afterprint", cleanup); };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 40);   // let the sheet paint first
  setTimeout(cleanup, 120000);            // fallback (afterprint occasionally doesn't fire)
}

function formatDateVN(d) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ---------- shared page chrome ----------
// The running TITLE + "Name/Date" + logo + page number are ALL native CSS
// "@page margin box" content (@top-left/@top-right/@bottom-left/@bottom-right
// — Chrome 131+), never position:fixed HTML. A fixed element's offsets are
// measured from the wrong reference box once @page has a non-zero margin, so
// mm values that look right on screen land somewhere else on paper — that's
// what pushed the header into the body content, and then left the logo
// "khá lệch" versus the title/page-count despite matching mm values (both
// caught 24/7/2026). Margin boxes have neither failure: @top-left/@bottom-left always
// share the page's left margin edge with each other, and @bottom-left/
// @bottom-right always share the same row — so the logo lines up with the
// title and the page count for free, no mm-guessing needed. They are also the
// only way to get a REAL page number: counter(page)/counter(pages) only
// resolve inside a margin box's `content`.
//
// The logo's two type sizes ("AWord" big+bold, "in ANDREW CLASSES" tiny+
// spaced) can't live in one CSS `content` string, so it's a small drawn SVG
// used as the box's image content instead — still a margin box, just an image
// one rather than a text one.
// `topRight` (optional) overrides the default "Name / Date: ___" blank line —
// Word uses it for the printed date + chosen class instead (runPrintWord()).
function buildSheet(activity, body, format, topRight) {
  const sheet = el("div", "aw-print-sheet aw-print-" + format);
  sheet.append(pageChromeStyle(activity.title || "Worksheet", topRight), body);
  return sheet;
}

function pageChromeStyle(title, topRight) {
  const style = document.createElement("style");
  const font = `font-family: "Baloo 2", "Segoe UI", Arial, sans-serif;`;
  style.textContent = `
    @page {
      size: A4;
      margin: 16mm 12mm 14mm;
      @top-left {
        content: ${cssString(title)};
        ${font} font-weight: 800; font-size: 12.5pt; color: #1c2733;
      }
      @top-right {
        content: ${cssString(topRight || "Name / Date: ________________________")};
        ${font} font-size: 9.5pt; color: #3a4653;
      }
      @bottom-left {
        content: ${logoImageUrl()};
      }
      @bottom-right {
        content: counter(page) "/" counter(pages);
        ${font} font-weight: 700; font-size: 10pt; color: #8a97a8;
      }
    }
  `;
  return style;
}

// The AWord logo as a small vector image (data URI) — "AWord" big+bold above
// "in ANDREW CLASSES" tiny+spaced, exactly the on-screen lockup, just drawn
// once instead of styled with two font sizes (which a margin box can't do).
function logoImageUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="26" viewBox="0 0 132 26">` +
    `<text x="0" y="15" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="15" fill="#566472">AWord</text>` +
    `<text x="0" y="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="6.5" letter-spacing="1" fill="#9aa4af">in ANDREW CLASSES</text>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// A CSS *string* literal — different escaping from escapeHtml() above (no
// entities; just backslash/quote per the CSS spec), and margin-box content
// can't hold a real newline, so any line break in a title is flattened.
function cssString(s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ") + '"';
}

function clueLine(i, it, withBulb) {
  const c = el("div", "aw-pf-clue");
  c.append(el("span", "aw-pf-num", `${i + 1}.`));
  if (withBulb) c.append(el("span", "aw-pf-bulb", icons.bulb));
  c.append(el("span", "aw-pf-cluetext", escapeHtml(it.clue || "")));
  return c;
}

// ---------- ANAGRAM: clue + scrambled letters + empty boxes ----------
function renderAnagram(items) {
  const body = el("div", "aw-print-body");
  items.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-anagram");
    item.append(clueLine(i, it, true));

    const letters = String(it.answer || "").toUpperCase().replace(/[^A-Z0-9]/g, "").split("");
    // ⭐ Đợt 415 — MỖI TỪ MỘT HÀNG, không bao giờ xuống dòng: hàng ô đã nowrap
    // (app.css), ô co lại khi từ dài. `--ag-max` = bề rộng ô lớn nhất mà n ô +
    // (n-1) khe (khe = 5/26 bề ô, co cùng tỉ lệ) vẫn lọt 1 cột; CSS lấy
    // min(cỡ thường × --pf-scale, --ag-max) nên PAGE-FIT giãn cũng không tràn.
    item.style.setProperty("--ag-max", anagramCellMax(letters.length).toFixed(2) + "px");
    const scr = el("div", "aw-pf-scramble");
    scrambled(letters).forEach(ch => scr.append(el("span", "aw-pf-sbox", escapeHtml(ch))));
    item.append(scr);

    const blanks = el("div", "aw-pf-blanks");
    letters.forEach(() => blanks.append(el("span", "aw-pf-blank")));
    item.append(blanks);

    body.append(item);
  });
  return body;
}

// Bề ngang dành cho hàng ô = 1 cột thật (PF_COL_W_MM) trừ lề trái 20px của
// .aw-pf-scramble/.aw-pf-blanks, chừa 3px an toàn cho viền/làm tròn.
// PURE + EXPORT — bàn thử: scratch/dot415-anagram-print-test.html.
const AG_AVAIL_PX = PF_COL_W_MM * MM_PX - 20 - 3;
const AG_GAP_RATIO = 5 / 26;     // khe 5px trên ô 26px — giữ đúng tỉ lệ khi co
export function anagramCellMax(n) {
  if (n <= 1) return AG_AVAIL_PX;
  return AG_AVAIL_PX / (n + (n - 1) * AG_GAP_RATIO);
}

// ---------- QUIZ: clue + A/B/C/D options with checkboxes ----------
function renderQuiz(items, pool) {
  const body = el("div", "aw-print-body");
  items.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-quiz");
    item.append(clueLine(i, it, true));

    // Use the source's own options when available (a real Quiz); otherwise
    // build 4 choices from the answer pool (works for any template).
    let opts;
    if (it.options && it.options.length) opts = shuffle(it.options.map(o => o.text));
    else opts = buildFromPool(it.answer, pool, 4);

    const grid = el("div", "aw-pf-options");
    opts.forEach((txt, k) => {
      const opt = el("div", "aw-pf-opt");
      opt.append(
        el("span", "aw-pf-letter", String.fromCharCode(65 + k)),
        el("span", "aw-pf-check"),
        el("span", "aw-pf-opttext", escapeHtml(String(txt).toUpperCase()))
      );
      grid.append(opt);
    });
    item.append(grid);
    body.append(item);
  });
  return body;
}

// ---------- UNJUMBLE: scrambled sentence words + a write-on line ----------
function renderUnjumble(items) {
  const body = el("div", "aw-print-body");
  items.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-unjumble");

    const line = el("div", "aw-pf-jumble");
    line.append(el("span", "aw-pf-num", `${i + 1}.`));
    const words = String(it.answer || "").trim().split(/\s+/).filter(Boolean);
    scrambled(words).forEach(w => line.append(el("span", "aw-pf-word", escapeHtml(w))));
    item.append(line);

    item.append(el("div", "aw-pf-writeline"));
    body.append(item);
  });
  return body;
}

// ---------- WORD: a plain vocabulary TABLE (STT · word/IPA · definition(s)) ----------
// `cols` is 1 key ("eng1"/"eng2"/"vi1"/"vi2") or 2 ("eng1","vi2" for ALL).
// No column headers (teacher: "không cần tiêu đề từng cột") — just rows, one
// word per row, original act order (a reference sheet, not a shuffled game).
function renderWord(rows, cols, isAll) {
  const body = el("div", "aw-print-body");
  rows.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-word");
    const line = el("div", "aw-wl-row" + (isAll ? " is-all" : ""));
    line.append(el("span", "aw-wl-stt", String(i + 1)));
    line.append(wordIpaCell(it.word, it.ipa));
    cols.forEach(k => line.append(el("span", "aw-wl-def", escapeHtml(clueOf(it, k)))));
    item.append(line);
    body.append(item);
  });
  return body;
}

// "word" bold, " • ipa" thin/muted (teacher: "từ font đậm, ipa mảnh, nhạt") —
// the dot lives INSIDE the ipa span so both share its lighter weight/color;
// no dot at all when a word has no IPA (not every WORDS act has it filled in).
function wordIpaCell(word, ipa) {
  const cell = el("span", "aw-wl-word");
  cell.append(el("span", "aw-wl-wordtext", escapeHtml(word || "")));
  if (ipa) cell.append(el("span", "aw-wl-ipa", " • " + escapeHtml(ipa)));
  return cell;
}

// ---------- CROSSWORD: an interlocking grid + numbered ACROSS/DOWN clues ----------
// Letters-only key for the grid (spaces/punctuation stripped, like Wordwall) —
// same rule templates/crossword/crossword.js uses, kept in step deliberately:
// a multi-word answer like "polar bear" still fills one continuous run of boxes.
function gridKeyOf(str) {
  return String(str ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

// Greedy interlock: longest word first at the origin, then each next word
// takes its best-scoring valid crossing over any word already placed. A word
// that can't cross anything is simply left off the grid (and so off the clue
// list too) — the same trade-off the live game already makes silently; there
// is no "no answer" placeholder to give it on paper.
// ⚠️ Deliberately NO randomness (unlike crossword.js's `fixed:false` default):
// this only ever runs once, right when the teacher presses Print, and two
// prints of the same act should hand back the same puzzle, not a shuffled one.
function buildCrosswordGrid(items) {
  const usable = items
    .map(it => ({ key: gridKeyOf(it.answer), clue: it.clue || "", answer: it.answer || "" }))
    .filter(w => w.key.length >= 2);

  const seen = new Set();
  const list = [];
  for (const w of usable) { if (!seen.has(w.key)) { seen.add(w.key); list.push(w); } }
  list.sort((a, b) => b.key.length - a.key.length);

  const cells = new Map();
  const placed = [];
  const at = (r, c) => cells.get(r + "," + c);

  function fitScore(key, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    let crossings = 0;
    if (at(row - dr, col - dc) != null) return -1;
    if (at(row + dr * key.length, col + dc * key.length) != null) return -1;
    for (let i = 0; i < key.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      const cur = at(r, c);
      if (cur != null) {
        if (cur !== key[i]) return -1;
        crossings++;
        continue;
      }
      if (dir === "A") {
        if (at(r - 1, c) != null || at(r + 1, c) != null) return -1;
      } else {
        if (at(r, c - 1) != null || at(r, c + 1) != null) return -1;
      }
    }
    return crossings;
  }

  function stamp(w, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    for (let i = 0; i < w.key.length; i++) cells.set((row + dr * i) + "," + (col + dc * i), w.key[i]);
    placed.push({ ...w, row, col, dir });
  }

  list.forEach((w, wi) => {
    if (wi === 0) { stamp(w, 0, 0, "A"); return; }
    let best = null;
    for (const p of placed) {
      const pdr = p.dir === "D" ? 1 : 0, pdc = p.dir === "A" ? 1 : 0;
      for (let j = 0; j < p.key.length; j++) {
        const pr = p.row + pdr * j, pc = p.col + pdc * j;
        const letter = p.key[j];
        for (let i = 0; i < w.key.length; i++) {
          if (w.key[i] !== letter) continue;
          const dir = p.dir === "A" ? "D" : "A";
          const row = dir === "D" ? pr - i : pr;
          const col = dir === "A" ? pc - i : pc;
          const score = fitScore(w.key, row, col, dir);
          if (score > 0 && (!best || score > best.score)) best = { row, col, dir, score };
        }
      }
    }
    if (best) stamp(w, best.row, best.col, best.dir);
  });

  if (!placed.length) return { grid: null, clues: [], rows: 0, cols: 0 };

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1, cols = maxC - minC + 1;

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  for (const [k] of cells) {
    const [r, c] = k.split(",").map(Number);
    grid[r - minR][c - minC] = { num: 0 };
  }
  placed.forEach(p => { p.row -= minR; p.col -= minC; });

  let n = 0;
  const numAt = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const startsAcross = (c === 0 || !grid[r][c - 1]) && (c + 1 < cols && grid[r][c + 1]);
      const startsDown = (r === 0 || !grid[r - 1][c]) && (r + 1 < rows && grid[r + 1][c]);
      if (startsAcross || startsDown) { n++; grid[r][c].num = n; numAt.set(r + "," + c, n); }
    }
  }

  const clues = placed.map(p => ({
    clue: p.clue, dir: p.dir, number: numAt.get(p.row + "," + p.col) || 0
  }));
  clues.sort((a, b) => a.number - b.number || (a.dir === b.dir ? 0 : a.dir === "A" ? -1 : 1));

  return { grid, clues, rows, cols };
}

// Cell size shrinks to fit the page width for a wide grid (long words / many
// crossings) but never grows past a comfortable writing size for a small one.
// mm, not cqw: this sheet has no container-query ancestor once it's on paper.
const CW_PAGE_WIDTH_MM = 176;   // A4 minus this sheet's own left/right @page margin
const CW_CELL_MAX_MM = 9;
const CW_CELL_MIN_MM = 5;

function renderCrossword(items, scale = 1) {
  const built = buildCrosswordGrid(items);
  const wrap = el("div", "aw-pf-cw-wrap");
  if (!built.grid) {
    wrap.append(el("div", "aw-pf-cw-empty",
      "These answers don't share enough letters to interlock into a crossword."));
    return wrap;
  }
  const { grid, clues, rows, cols } = built;
  const widthFitMm = CW_PAGE_WIDTH_MM / cols;
  const baseCellMm = Math.max(CW_CELL_MIN_MM, Math.min(CW_CELL_MAX_MM, widthFitMm));
  // PAGE-FIT (xem runPrint) có thể GIÃN cỡ ô quá mốc CW_CELL_MAX_MM khi trang
  // còn trống nhiều — nhưng không bao giờ vượt bề ngang thật của trang.
  const cellMm = Math.min(baseCellMm * scale, widthFitMm);
  wrap.style.setProperty("--pf-scale", String(scale)); // cỡ chữ chú thích co/giãn theo cùng tỉ lệ

  const gridEl = el("div", "aw-pf-cw-grid");
  gridEl.style.setProperty("--cw-cols", String(cols));
  gridEl.style.setProperty("--cw-cell", cellMm + "mm");
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const box = el("div", "aw-pf-cw-cell" + (cell ? "" : " is-blank"));
      if (cell && cell.num) box.append(el("span", "aw-pf-cw-num", String(cell.num)));
      gridEl.append(box);
    }
  }
  wrap.append(gridEl);

  const clueBox = el("div", "aw-pf-cw-clues");
  clueBox.append(
    crosswordClueColumn("ACROSS", clues.filter(c => c.dir === "A")),
    crosswordClueColumn("DOWN", clues.filter(c => c.dir === "D"))
  );
  wrap.append(clueBox);
  return wrap;
}

function crosswordClueColumn(label, list) {
  const col = el("div", "aw-pf-cw-col");
  col.append(el("div", "aw-pf-cw-collabel", label));
  list.forEach(c => {
    const line = el("div", "aw-pf-cw-clueline");
    line.append(el("span", "aw-pf-cw-cluenum", `${c.number}.`), el("span", "aw-pf-cw-cluetext", escapeHtml(c.clue)));
    col.append(line);
  });
  return col;
}

// ---------- helpers ----------
// Shuffle a copy; try a few times so the result differs from the original
// order (best effort — impossible for arrays with all-identical items).
function scrambled(arr) {
  if (arr.length < 2) return arr.slice();
  const orig = arr.join("");
  let out = arr.slice();
  for (let t = 0; t < 15; t++) { out = shuffle(arr); if (out.join("") !== orig) break; }
  return out;
}

// Build `n` multiple-choice options: the correct answer + distinct distractors
// drawn from the pool of every answer in the activity, then shuffled.
function buildFromPool(correct, pool, n) {
  const others = [...new Set(pool.map(x => String(x)))]
    .filter(x => x && x.toUpperCase() !== String(correct).toUpperCase());
  const distract = shuffle(others).slice(0, Math.max(0, n - 1));
  return shuffle([correct, ...distract]);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
