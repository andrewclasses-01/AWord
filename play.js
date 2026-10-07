// =============================================================
// play.js — THE STUDENT PAGE (play.html?g=<assignment code>)
//
// Deliberately a separate page from the teacher's app:
//   * it never imports core/store.js, so the teacher's library cannot even be
//     reached from here — a student only ever sees the one assigned act;
//   * it never asks anyone to sign in. Open the link, type a name, play.
//
// Flow (Đợt 383 — GỘP PRACTICE + SUBMIT, thầy chốt 24–25/09/2026):
//   link -> name -> ONE START button -> the game. Every round with a score ≥ 1 is HANDED IN:
//   · finished (incl. time up): uploads the moment the game ends (queueAttempt/sendAttempt below); the
//     SUBMITTING screen runs by itself and waits for the server's confirmation.
//   · left midway (Start again · reload · close tab): handed in as `doDang` — see `nopLuotDo` below.
//   · a "Start with mistakes" round is practice: never handed in, only timed (practiceLog).
// Students may play as many times as they like; every handed-in round is recorded.
// =============================================================

import { startGame } from "./core/engine.js";
import { el } from "./core/utils.js";
import {
  getAssignment, queueAttempt, sendAttempt, flushOutbox,
  listScores, isLate, nameKey, prettiestName, rankCompare,
  tenTheoMa, chuanMaEm, docBangDiem,   // Đợt 432/433 — bảng xếp hạng gộp theo MÃ em, tên thật từ danh sách lớp
  sendSpecialAttempt,  // myLesson "HỌC SINH ĐẶC BIỆT" — kho điểm RIÊNG, xem assignments.js
  newPlayLogId, beatPlayLog,  // Đợt 366 — kho LƯỢT LUYỆN practiceLog (thời gian mọi lượt, cả bỏ dở)
  newAttemptId, saveDraft, dropDraft, queueAttemptKeepalive,  // Đợt 383 — nộp lượt DỞ DANG
  sanVe   // Đợt 410 — VÉ đăng nhập của em do trang mẹ myLesson cấp (core/assignments.js)
} from "./core/assignments.js";
import { ensureTemplate } from "./core/registry.js";
import { gioChuan } from "./core/gio-chuan.js";   // Đợt 422 — mốc giờ theo máy chủ
import { khoaLuot, docLuot, ghiLuot, xoaLuot, nhipSong, tabKhacDangLam, dauVet, trangKhacMo, chiemTrang } from "./core/lam-tiep.js";   // Đợt 469 — giữ lượt dở, mở lại làm tiếp · Đợt 490 — một bài một trang
import { tiLeDaLam, ghiRoiVan, ghiXongVan, layNhacCho, hienNhac, dangMo, ghiDat100, daDat100, canKiemMayChu, ghiDaKiem } from "./bo-cuoc.js";   // Đợt 424 — "Start Again quá sớm"
// No template is imported here on purpose. ensureTemplate() fetches the ONE
// game this assignment uses, right before it starts — so a student on a phone
// downloads one game, not the whole catalogue.

const app = document.getElementById("app");
const REMEMBER_KEY = "aword-student-name";

// ⭐⭐ Đợt 380 (thầy chốt 24/09/2026, dashboard myLesson web đợt 44) — THỜI GIAN HOẠT ĐỘNG.
// `timeMs` của practiceLog là ĐỒNG HỒ TƯỜNG từ lúc vào ván: em mở act rồi để treo tab, chuyển
// tab khác, tắt màn hình… vẫn cộng — thầy thấy lượt bỏ dở 0 điểm mà 4 giờ 49 phút. Nay đo THÊM
// `activeMs`: mỗi giây chỉ cộng khi (1) tab đang HIỆN và (2) em vừa chạm/gõ/cuộn trong
// HD_CHO_MS (dạng ĐỌC — bài đọc dài — HD_CHO_DOC_MS vì em cần đọc) HOẶC một âm thanh KHÔNG LẶP
// đang phát (giọng đọc, băng nghe; nhạc nền `loop` không tính). Treo quá HD_TREO_MS thì nhịp 1
// phút KHÔNG ghi nữa (đỡ lượt ghi) — em quay lại là nhịp kế ghi tiếp. `timeMs` giữ nguyên nghĩa
// cũ (dashboard dùng làm "mở tab bao lâu"). ⛔ Chỉ ở trang học sinh — KHÔNG đụng core/.
const HD_CHO_MS = 60000, HD_CHO_DOC_MS = 180000, HD_TREO_MS = 600000;
const HD_SU_KIEN = ["pointerdown", "touchstart", "keydown", "wheel", "input"];
// Âm thanh đang phát: bắt mọi `play()` (kể cả `new Audio()` không nằm trong DOM), bỏ ra khi dừng.
const AM_DANG_PHAT = new Set();
(() => {
  const goc = HTMLMediaElement.prototype.play;
  const bo = (e) => AM_DANG_PHAT.delete(e.currentTarget);
  HTMLMediaElement.prototype.play = function (...a) {
    if (!AM_DANG_PHAT.has(this)) {
      AM_DANG_PHAT.add(this);
      this.addEventListener("pause", bo, { once: true });
      this.addEventListener("ended", bo, { once: true });
    }
    return goc.apply(this, a);
  };
})();
function coAmDangPhat() {
  for (const a of AM_DANG_PHAT) if (!a.paused && !a.ended && !a.loop && !a.muted && a.volume > 0) return true;
  return false;
}
// Dạng ĐỌC: tên bài giao myLesson đuôi /TF · /FILLING · /RD… , hoặc act có một đoạn chữ dài (bài đọc).
function laDangDoc(assignment, activity) {
  if (/\/(TF|FILLING|RD[A-Z]*)\b/i.test(String(assignment.title || ""))) return true;
  let dai = false;
  try { JSON.stringify(activity, (k, v) => { if (typeof v === "string" && v.length > 300 && !/^data:/.test(v)) dai = true; return v; }); } catch (e) {}
  return dai;
}
function taoDoHoatDong(choMs, goc = 0) {   // Đợt 469 — `goc`: giờ hoạt động đã có của lượt đang LÀM TIẾP
  let activeMs = Math.max(0, Number(goc) || 0), lanCham = Date.now(), lucTick = Date.now(), timer = null;
  const cham = () => { lanCham = Date.now(); };
  const tick = () => {
    if (!timer) return;   // đã dừng: số chốt, không cộng thêm
    const t = Date.now(), d = t - lucTick; lucTick = t;
    if (document.visibilityState !== "visible") return;
    // ⭐ Đợt 420 (28/09/2026) — ☰ Menu đang mở = ván TẠM DỪNG: đồng hồ game đứng (engine `pauseClockForMenu`)
    // thì giờ hoạt động cũng đứng. Trước đây vẫn cộng (cú bấm mở menu là một lần chạm ⇒ +60 s, bài đọc 180 s,
    // âm thanh đang phát) ⇒ 105/6.070 lượt có activeMs > timeMs (quét 28/9). Đọc DOM, không đụng core/.
    // Đợt 468 — menu `.is-chay` (em đã đạt 100%) KHÔNG dừng ván ⇒ giờ hoạt động vẫn tính như thường.
    if (document.querySelector(".aw-menu:not(.is-chay)")) return;
    // trần 2 s/nhịp: tab vừa hiện lại / máy vừa thức dậy thì khoảng ngủ không lọt vào
    if (t - lanCham <= choMs || coAmDangPhat()) activeMs += Math.min(Math.max(d, 0), 2000);
  };
  HD_SU_KIEN.forEach(e => document.addEventListener(e, cham, { capture: true, passive: true }));
  timer = setInterval(tick, 1000);
  return {
    doc() { tick(); return Math.round(activeMs); },
    treo() { return Date.now() - lanCham > HD_TREO_MS && !coAmDangPhat(); },
    dung() {
      if (!timer) return;
      tick(); clearInterval(timer); timer = null;
      HD_SU_KIEN.forEach(e => document.removeEventListener(e, cham, { capture: true }));
    }
  };
}

start();

async function start() {
  // ⭐ Đợt 200 — CHẾ ĐỘ NHÚNG (`&nhung=1`): trang bài tập của myLesson mở bài
  // giao trong một ô đúng bằng khung game, nên trang này phải bỏ lề và ẩn dải
  // dưới khung (tên act + nút công cụ) — nếu không, khung không bao giờ khớp ô
  // bên kia và luôn thò ra một đoạn phải cuộn. Rule nằm ở `core/app.css`
  // (`html.aw-nhung`), chỉ bật khi CÓ cờ nên link cũ không đổi gì.
  if (new URLSearchParams(location.search).get("nhung") === "1") {
    document.documentElement.classList.add("aw-nhung");
  }
  // ⭐ Đợt 246 — deliver whatever an earlier visit still owes (a SUBMIT that
  // never got its confirmation before the tab died). Background, best-effort:
  // the outbox keeps anything that still fails.
  flushOutbox().catch(() => {});
  const code = new URLSearchParams(location.search).get("g");
  if (!code) return showMessage("This link is incomplete", "Ask your teacher for the full link.");

  showMessage("Loading...", "");
  let assignment = null;
  // ⭐ Đợt 431 (30/9/2026) — iPhone/iPad hay kẹt "Loading..." mãi: lượt đọc bài không
  // có hạn chờ. Quá 8s thì hiện nút "Try again" (tải lại trang) nhưng VẪN chờ tiếp —
  // lượt đọc về muộn thì đi tiếp bình thường, màn tên em thay chỗ màn này.
  const cham = setTimeout(() => showMessage("Loading is taking too long",
    "Check your connection, then press Try again.", true), 8000);
  try {
    assignment = await getAssignment(code);
  } catch (e) {
    clearTimeout(cham);
    return showMessage("No internet connection", "Check your connection and open the link again.", true);
  }
  clearTimeout(cham);
  if (!assignment || !assignment.activity) {
    return showMessage("Assignment not found", "This link may be old. Ask your teacher for a new one.");
  }
  // So a link-naming tool (myLink) reading this page's <title> gets the actual
  // assignment name instead of the same generic title on every play link.
  document.title = `${assignment.title || assignment.activityTitle || "AWord"} — AWord`;
  // The teacher can close an assignment, or move it to the recycle bin. Either
  // way the link still opens — it just explains itself instead of playing.
  if (assignment.trashed) {
    return showMessage("This assignment is no longer available",
      "Your teacher has removed it. Ask them for the new link.");
  }
  if (assignment.closed) {
    return showMessage("This assignment is closed",
      "Your teacher is no longer accepting answers for it.");
  }
  // A name handed over by myLesson (`play.html?g=<code>&n=<name>`). The student
  // signed in there already, so asking again would only invite typos — and typos
  // are exactly what wrecks a leaderboard. Links without `n` behave as before.
  const q = new URLSearchParams(location.search);
  const handed = (q.get("n") || "").trim().replace(/\s+/g, " ");
  // ⭐ Đợt 199 — the CLASS comes over too (`&lop=A1A`), so the READY screen can
  // say "TUẤN KHANG - A1A". Old links without it still work: the READY screen
  // then shows the name alone.
  const lop = (q.get("lop") || "").trim().replace(/\s+/g, " ").slice(0, 12);
  // ⭐ Đợt 367 (22/9/2026) — MÃ học sinh myStudent (`&ma=`, myLesson web v1.134.0) đi kèm tên.
  // Ghi vào scores / results / practiceLog để đổi TÊN em bên myStudent không làm điểm cũ "lạc":
  // myLesson khớp theo mã trước, tên sau. Link không có `ma` (chơi tự do) ⇒ chuỗi rỗng, không ghi.
  const ma = (q.get("ma") || "").trim().replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
  if (handed.length >= 2) {
    try { localStorage.setItem(REMEMBER_KEY, handed); } catch (e) { /* private mode: fine */ }
    return play(assignment, handed.slice(0, 40), lop, ma);
  }
  showNameScreen(assignment);
}

// ---------------- screens ----------------
function shell() {
  app.innerHTML = "";
  const wrap = el("div", "aw-lib aw-stu");
  const bar = el("div", "aw-appbar");
  bar.append(brand());
  wrap.append(bar);
  app.append(wrap);
  return wrap;
}

// Same mark as the teacher's app (main.js `logo`), minus the click-to-go-home —
// a student has no home to go to.
function brand() {
  const b = el("div", "aw-brand");
  b.append(
    el("div", "aw-brand-logo", 'A<span>Word</span>'),
    el("div", "aw-brand-sub", 'in <b>ANDREW CLASSES</b>')
  );
  return b;
}

function footer() {
  const f = el("div", "aw-foot");
  f.append(el("div", "aw-foot-line", "Phone &amp; Zalo: 0359.769.765"));
  f.append(el("div", "aw-foot-line aw-foot-copy",
    "Copyright © 2018 - 2026 ANDREW CLASSES by Pham Xuan Ninh. All Rights Reserved."));
  return f;
}

function showMessage(title, sub, thuLai) {
  const wrap = shell();
  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", title));
  if (sub) card.append(el("div", "aw-login-sub", sub));
  // Đợt 431 — nút tải lại cho các màn lỗi mạng (iPhone/iPad không có nút reload dễ thấy khi nhúng trong myLesson).
  if (thuLai) {
    const b = el("button", "aw-as-btn aw-as-primary aw-stu-go", "TRY AGAIN");
    b.type = "button";
    b.onclick = () => location.reload();
    card.append(b);
  }
  wrap.append(card, footer());
}

// ⛔⛔ Đợt 431 (30/9/2026) — Đợt 414 (27/9) gọi `escapeText` ở màn nhập tên nhưng play.js
// KHÔNG có hàm này (nó chỉ nằm RIÊNG trong engine.js / assignment-ui.js, không export) ⇒
// ReferenceError ⇒ mọi link bài giao KHÔNG qua myLesson (QR, link trần — không có `&n=`)
// đứng mãi ở "Loading..." từ 27/9. Bản sao y hệt engine.js.
function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showNameScreen(assignment) {
  const wrap = shell();
  const card = el("div", "aw-login");
  // Đợt 414 (27/9/2026, rà XSS): `el()` gán innerHTML — tiêu đề bài từ Firestore phải escape (chỉ thầy ghi được, nhưng
  // đây là chỗ DUY NHẤT tiêu đề đi thẳng vào HTML; các chỗ khác đã escapeText). Không đổi giao diện.
  card.append(el("div", "aw-login-title", escapeText(assignment.activityTitle || assignment.title || "Ready to play")));
  card.append(el("div", "aw-login-sub", "Type your name, then press Start."));

  const form = el("form", "aw-stu-form");
  const input = el("input", "aw-as-input aw-stu-name");
  input.type = "text";
  input.maxLength = 40;
  input.placeholder = "Your name";
  input.autocomplete = "name";
  input.value = localStorage.getItem(REMEMBER_KEY) || "";
  const go = el("button", "aw-as-btn aw-as-primary aw-stu-go", "START");
  go.type = "submit";
  form.append(input, go);
  card.append(form);

  const err = el("div", "aw-as-err", "");
  card.append(err);

  if (isLate(assignment)) {
    card.append(el("div", "aw-stu-late",
      "The deadline has passed — you can still play, and your teacher will see it as late."));
  }

  form.onsubmit = e => {
    e.preventDefault();
    const name = input.value.trim().replace(/\s+/g, " ");
    if (name.length < 2) { err.textContent = "Please type your name."; input.focus(); return; }
    try { localStorage.setItem(REMEMBER_KEY, name); } catch (e2) { /* private mode: fine */ }
    play(assignment, name);
  };

  wrap.append(card, footer());
  setTimeout(() => input.focus(), 30);
}

// ---------------- một bài một trang (Đợt 490) ----------------
// ⭐⭐ Đợt 490 (thầy chốt 06/10/2026) — chặn mở CÙNG một bài giao ở nhiều tab/trang (xem core/lam-tiep.js `chiemTrang`).
// Trả về true khi trang này được làm bài. `?dung=1` = trang vừa NHƯỜNG chỗ (chỉ hiện thông báo); `?gianh=1` = em bấm
// "PLAY HERE" ở màn thông báo ⇒ giành chỗ ngay. Phụ huynh (`db=1`) không giữ chỗ (không ghi điểm lớp).
function urlBo(them) {
  const u = new URL(location.href);
  u.searchParams.delete("dung"); u.searchParams.delete("gianh");
  if (them) u.searchParams.set(them, "1");
  return u.href;
}
function manMotTrang(title, sub, nutChu, onNut) {
  const wrap = shell();
  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", title));
  card.append(el("div", "aw-login-sub", sub));
  const b = el("button", "aw-as-btn aw-as-primary aw-stu-go", nutChu);
  b.type = "button";
  b.onclick = onNut;
  card.append(b);
  wrap.append(card, footer());
}
function giuMotTrang(k) {
  const q = new URLSearchParams(location.search);
  if (q.get("dung") === "1") {
    manMotTrang("This game is now open in another tab",
      "Bài này vừa được mở ở một trang khác — hãy làm tiếp ở trang đó. Muốn làm ở trang này thì bấm nút dưới.",
      "PLAY HERE", () => location.replace(urlBo("gianh")));
    return Promise.resolve(false);
  }
  if (q.get("gianh") === "1") { try { history.replaceState(null, "", urlBo()); } catch (e) {} return Promise.resolve(true); }
  if (!trangKhacMo(k)) return Promise.resolve(true);
  return new Promise(xong => {
    let hen = null;
    const di = () => { clearInterval(hen); xong(true); };
    manMotTrang("This game is already open in another tab",
      "Mỗi bài chỉ làm ở MỘT trang. Hãy quay lại trang đang mở bài, hoặc bấm nút dưới để làm ở trang này (trang kia sẽ dừng, bài đang làm dở được giữ nguyên).",
      "PLAY HERE", di);
    hen = setInterval(() => { if (!trangKhacMo(k)) di(); }, 1000);   // trang kia đã đóng / chết ⇒ tự vào
  });
}

// ---------------- the game ----------------
async function play(assignment, studentName, className, studentMa) {
  const ma = String(studentMa || "");   // Đợt 367 — mã em, rỗng khi không qua myLesson
  // ⭐ Đợt 490 — một bài một trang (trước MỌI thứ khác: chưa dựng ván, chưa đọc lượt dở).
  const khoaTrang = khoaLuot(assignment.code, ma, studentName);
  const laPhuHuynh = new URLSearchParams(location.search).get("db") === "1";
  if (!laPhuHuynh) {
    if (!(await giuMotTrang(khoaTrang))) return;
    // Bị trang khác giành chỗ ⇒ sang màn thông báo; pagehide của trang này cất lượt dở như tải lại (Đợt 469).
    chiemTrang(khoaTrang, () => location.replace(urlBo("dung")));
  }
  // A fresh copy each time so a replay never inherits the previous play's state.
  const activity = JSON.parse(JSON.stringify(assignment.activity));

  // Fetch this one game before wiping the screen, so a slow classroom
  // connection shows "Loading..." instead of a blank page. Every act type in
  // core/catalog.js works here — the student page is no longer quiz-only.
  showMessage("Loading...", "");
  try {
    await ensureTemplate(activity.type);
  } catch (e) {
    return showMessage("This game could not be opened",
      "Check your connection and open the link again.", true);
  }

  app.innerHTML = "";
  // ⭐⭐ myLesson "HỌC SINH ĐẶC BIỆT" (thầy Andrew chốt 09/09/2026) — phụ huynh
  // luyện bài CÙNG con qua trang nhúng của myLesson, mang cờ `&db=1`. Chơi được,
  // nhưng KHÔNG được ghi vào kho điểm chung của lớp (không tính lượt nộp, không
  // vào leaderboard/kết quả của thầy) và màn kết thúc CHỈ được thấy đúng dòng của
  // CHÍNH mình — xem `submit`/`retrySubmit`/`entries` bên dưới.
  const dacBiet = new URLSearchParams(location.search).get("db") === "1";
  // ⭐ Đợt 410 — xin VÉ đăng nhập ngay khi vào ván (keepalive lúc đóng tab KHÔNG chờ được vé). Phụ huynh không có mã.
  if (ma && !dacBiet) sanVe(ma);
  // ⭐ Đợt 424 — đếm BỎ CUỘC liên tiếp (bo-cuoc.js). Bước "Xem các câu sai" chỉ khi bài bật Show answers.
  const khoaBC = { code: assignment.code, ma, ten: studentName };
  const coShowBC = (assignment.endOptions || {}).showAnswers !== false;
  // ⭐ Đợt 246 — one attempt at a time. `submit` freezes the play into the
  // outbox and starts delivering; `retrySubmit` re-runs delivery for the SAME
  // attempt (same fixed id — a re-send can never create a second row). Both
  // resolve {ok:boolean} and never reject; see core/assignments.js.
  let attempt = null;
  // Đợt 366 — lượt chơi ĐANG ghi nhật ký (null = chưa vào ván / đã rời ván).
  let playLog = null;
  // ⭐ Đợt 380 — bộ đo THỜI GIAN HOẠT ĐỘNG của lượt đang chơi (xem `taoDoHoatDong` đầu file).
  let hoatDong = null;
  const choMs = laDangDoc(assignment, activity) ? HD_CHO_DOC_MS : HD_CHO_MS;
  // ⭐⭐ Đợt 469 (thầy chốt 05/10/2026) — GIỮ LƯỢT DỞ, MỞ LẠI LÀM TIẾP (core/lam-tiep.js). Template biết lưu
  // (Quiz · Type the answer · Find the gap) ⇒ engine đưa trạng thái ván qua `session.luuLamTiep` sau mỗi câu, và
  // pagehide / tab ẩn chụp thêm một lần (`playLog.trangThaiNay`). Mở lại bài ⇒ nút CONTINUE, ván dựng lại đúng chỗ,
  // dùng LẠI mã lượt (`nhapId`), mã nhật ký, mốc bắt đầu (đồng hồ GIỜ THẬT) và giờ hoạt động của lượt cũ.
  // Lượt đang giữ KHÔNG nộp dở lúc tải lại / đóng tab và không tính "bỏ cuộc" (bo-cuoc.js) — em chưa bỏ.
  const khoaLT = khoaLuot(assignment.code, ma, studentName);
  const vetDe = dauVet(activity);
  let lamTiepCho = null;    // lượt dở đang giữ, chờ ván đầu tiên của trang này
  let lamTiepDung = null;   // playLog.start đã nhận, chờ engine lấy trạng thái ván (begin)
  let lamTiepXet = !dacBiet;   // Đợt 489 — ván đầu của trang CHƯA bắt đầu ⇒ còn xét lại được
  // 🔎 Đợt 490 — LÝ DO (chẩn đoán, trường `lt` của practiceLog): thầy thấy em vẫn ra ván mới thay vì CONTINUE mà kho không cho biết
  // vì sao (BẢO NAM, DIỆU CHI NTK9 06/10). `ltMo` = tình trạng lúc MỞ trang: co · khong-co · vet (đề đổi) · khong-tpl · tab-khac,
  // kèm sức khoẻ localStorage (`ls-loi` = không ghi được; `ls<KB>k` = dung lượng đang dùng — gần 5 MB là đầy).
  let ltMo = "khong-co", ltLs = "";
  try {
    localStorage.setItem("aw-ls-thu", "1"); localStorage.removeItem("aw-ls-thu");
    let n = 0; for (let i = 0; i < localStorage.length; i++) { const kk = localStorage.key(i) || ""; n += kk.length + (localStorage.getItem(kk) || "").length; }
    ltLs = "ls" + Math.round(n / 1024) + "k";
  } catch (e) { ltLs = "ls-loi"; }
  if (!dacBiet) {
    const s = docLuot(khoaLT);
    if (s && s.vet !== vetDe) { ltMo = "vet"; xoaLuot(khoaLT); }   // thầy đã sửa đề ⇒ không dựng lại được; nháp cũ được nộp dở như trước
    else if (s && !s.tpl) ltMo = "khong-tpl";
    else if (s && tabKhacDangLam(khoaLT)) ltMo = "tab-khac";   // tab khác đang làm chính lượt này ⇒ tab này chơi lượt mới
    else if (s) { ltMo = "co"; lamTiepCho = s; }
  }
  // ⭐⭐ Đợt 489 (06/10/2026) — XÉT LẠI LÚC BẤM, KHÔNG CHỈ LÚC MỞ TRANG. Trước đây "có làm tiếp không" chốt MỘT lần lúc nạp
  // trang: trang mở ra đúng lúc trang/tab khác cùng bài còn sống (nhịp < 6 s) là mất quyền làm tiếp VĨNH VIỄN — tab kia đóng
  // rồi em bấm START vẫn ra lượt mới từ câu 1 (đo kho 06/10: LINH NHI FTG 09:42→09:49, TUẤN KIỆT TTA 12:38, HÀ PHƯƠNG nhiều
  // tab; tái hiện trên bản live: tab 1 đang làm, mở tab 2, đóng tab 1 ⇒ tab 2 START, ván mới). Nay engine hỏi lại
  // `lamTiepNhan` mỗi 2 s khi còn ở màn READY (nút tự đổi START → CONTINUE) và `playLog.start` hỏi lại lần cuối.
  function xetLamTiep() {
    if (!lamTiepXet || lamTiepCho) return lamTiepCho;
    const s = docLuot(khoaLT);
    if (s && s.vet === vetDe && s.tpl && !tabKhacDangLam(khoaLT)) lamTiepCho = s;
    return lamTiepCho;
  }
  let songTimer = null;
  const batSong = () => { if (!songTimer) { nhipSong(khoaLT, true); songTimer = setInterval(() => nhipSong(khoaLT, true), 2000); } };
  const tatSong = () => { if (songTimer) { clearInterval(songTimer); songTimer = null; } nhipSong(khoaLT, false); };
  function luuLuot(t) {   // t = { tpl, timeCost } do engine chụp
    if (!t || !t.tpl || !playLog || playLog.done || playLog.mistakes || dacBiet) return false;
    const ok = ghiLuot(khoaLT, { vet: vetDe, nhapId: playLog.nhapId, logId: playLog.id, createdAt: playLog.createdAt,
                             batDau: playLog.batDau, activeMs: hoatDong ? hoatDong.doc() : (playLog.activeMs || 0),
                             timeCost: Number(t.timeCost) || 0, tpl: t.tpl, lt: playLog.lt || "" });
    // 🔎 Đợt 490 — cất lượt dở THẤT BẠI (localStorage đầy / bị chặn) ⇒ đánh dấu vào lý do để thầy thấy trên kho.
    if (!ok && playLog.lt && playLog.lt.indexOf("luu!") < 0) playLog.lt = (playLog.lt + "|luu!").slice(0, 60);
    return ok;
  }
  function chupLuot() {
    if (!playLog || playLog.done || playLog.mistakes || !playLog.trangThaiNay) return false;
    let t = null;
    try { t = playLog.trangThaiNay(); } catch (e) { t = null; }
    return luuLuot(t);
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") chupLuot(); });
  window.addEventListener("pageshow", e => { if (e.persisted && playLog && !playLog.done && !playLog.mistakes) batSong(); });
  // ⛔ Đóng tab/đổi trang: engine KHÔNG kịp gọi leave(), nên tự tính "đã chơi bao lâu" theo
  // đồng hồ tường từ mốc `batDau` (đo thật 22/09: gửi lại gói cũ thì thiếu cả phút cuối).
  window.addEventListener("pagehide", () => {
    if (!playLog || playLog.done) return;
    // ⭐ Đợt 469 — lượt GIỮ được ⇒ chụp lần cuối, cất NHÁP (em không bao giờ quay lại thì hết hạn giữ nó vẫn được
    // nộp dở như cũ — core/assignments.js sweepDrafts), ghi nhịp nhật ký, KHÔNG nộp dở, KHÔNG đếm bỏ cuộc.
    const giu = chupLuot();
    tatSong();
    if (giu) {
      if (hoatDong) playLog.activeMs = hoatDong.doc();
      playLog.timeMs = Math.max(playLog.timeMs, Date.now() - playLog.batDau);
      try {
        const d = playLog.diemNay ? playLog.diemNay() : null;
        if (d && Number(d.score) >= 1 && !khongNopDo()) saveDraft({ code: assignment.code, studentName, ma, score: d.score, total: d.total,
                                                   timeMs: gioLuotDo(Date.now() - playLog.batDau), review: [], doDang: true, attemptId: playLog.nhapId });   // Đợt 491 — em đã 100%: không nháp
      } catch (e) { /* nháp chỉ là lưới an toàn */ }
      beatPlayLog(playLog, { keepalive: true });
      return;
    }
    if (hoatDong) playLog.activeMs = hoatDong.doc();
    playLog.timeMs = Math.max(playLog.timeMs, Date.now() - playLog.batDau);
    // ⭐ Đợt 384 — bài làm tới lúc này: lượt được NỘP DỞ ⇒ đi vào results; không nộp ⇒ đi vào practiceLog.
    let rvDo = null;
    try { rvDo = playLog.baiLamNay ? playLog.baiLamNay() : null; } catch (e) { rvDo = null; }
    nopLuotDo({ gap: true, review: rvDo });   // ⭐ Đợt 383 — tải lại / đóng tab giữa ván: nộp lượt dở (điểm ≥ 1)
    // ⭐ Đợt 424 — bỏ cuộc bằng tải lại / đóng tab: không hiện được ⇒ cất nhắc cho lần mở sau.
    if (!dacBiet && !playLog.mistakes) {
      try { const d = playLog.diemNay ? playLog.diemNay() : null;
            ghiRoiVan({ ...khoaBC, tiLe: tiLeDaLam({ review: rvDo, score: d && d.score, total: d && d.total }), trangChet: true }); } catch (e) {}
    }
    if (!playLog.attemptId && rvDo) playLog.review = rvDo;
    beatPlayLog(playLog, { keepalive: true });
  });
  // ⭐⭐ Đợt 383 (thầy chốt 24/09) — NỘP LƯỢT DỞ DANG: em bỏ giữa ván (Start again · về trang bài · tải lại ·
  // đóng tab) mà điểm ≥ 1 ⇒ lượt đó VẪN TÍNH, mang `doDang: true` (myLesson không lấy nó làm mẫu số chuẩn).
  // Lượt Start with mistakes không bao giờ nộp. `gap` = đang pagehide: đẩy outbox + REST keepalive (không
  // chờ được SDK). Chỉ nộp MỘT lần mỗi lượt (`daNopDo`) — trang quay lại từ bfcache rồi bấm Start again
  // không nộp lượt ấy lần thứ hai. review rỗng: template chưa tới bước kết thúc của nó.
  // ⭐ Đợt 418 (28/09/2026) — giờ của lượt DỞ = THỜI GIAN HOẠT ĐỘNG (Đợt 380), không phải đồng hồ tường.
  // Đồng hồ engine chạy cả khi tab treo/nền: MẠC MINH KHANG (L20 BT2) mở ván 16:36 27/9, để treo tới sáng
  // hôm sau rồi lượt dở mới được nộp ⇒ kho scores ghi 1078 phút cho 1/30 câu. Lượt tới ĐÍCH giữ nguyên.
  function gioLuotDo(tuong) {
    const hd = hoatDong ? hoatDong.doc() : (playLog ? playLog.activeMs : null);
    return Number.isFinite(hd) && hd >= 0 ? Math.min(tuong | 0, Math.round(hd)) : (tuong | 0);
  }
  // ⚠️ Khai bằng `function` (không phải const) vì listener pagehide ở trên gọi nó.
  // ⭐ Đợt 491 (thầy chốt 07/10/2026) — em ĐÃ đạt 100% ở act này (`daDat100`) chơi lại để đua thời gian: bỏ giữa ván KHÔNG
  // nộp dở nữa (đo 06–07/10: 173/175 ván bỏ dở là của em đã 100% — ĐĂNG KHOA B1B Quiz 152 ván vài giây ⇒ hơn trăm dòng
  // `doDang` rác trong scores; lượt dở không bao giờ hơn được 100% đã có). Nhật ký practiceLog vẫn ghi như cũ (giờ luyện).
  function khongNopDo() { return !dacBiet && daDat100(khoaBC); }   // function: listener pagehide ở trên gọi nó
  function nopLuotDo({ gap = false, score = null, total = null, timeMs = null, review = null } = {}) {
    if (!playLog || playLog.done || playLog.mistakes || playLog.daNopDo) return;
    if (khongNopDo()) { dropDraft(playLog.nhapId); return; }   // Đợt 491
    let d = { score, total, timeMs };
    if (d.score == null && playLog.diemNay) { try { d = playLog.diemNay() || d; } catch (e) {} }
    const diem = Math.round(Number(d.score)) || 0;
    if (diem < 1) { dropDraft(playLog.nhapId); return; }   // 0 điểm (hay âm): không nộp — nháp cũ cũng bỏ
    playLog.daNopDo = true;
    playLog.score = diem;
    const goi = { code: assignment.code, studentName, ma, score: diem, total: d.total || 0,
                  timeMs: gioLuotDo(d.timeMs != null ? d.timeMs : playLog.timeMs), review:Array.isArray(review) ? review : [], doDang: true };   // Đợt 384 — + bài làm tới lúc dừng
    if (dacBiet) {
      sendSpecialAttempt(goi, { keepalive: gap }).catch(() => {});
      return;
    }
    goi.attemptId = playLog.nhapId;
    dropDraft(playLog.nhapId);
    if (gap) {
      playLog.attemptId = queueAttemptKeepalive(goi).attemptId;
    } else {
      const e = queueAttempt(goi);
      playLog.attemptId = e.attemptId;
      baoNopChoTrangMe(sendAttempt(e)).catch(() => {});
    }
  }
  // Đợt 257 — xem chú thích ở `submit` bên dưới. Trả lại NGUYÊN promise gốc:
  // đường nộp/nộp lại không đổi một li nào, tin báo chỉ là người đứng nghe.
  const baoNopChoTrangMe = (giao) => {
    giao.then((kq) => {
      if (!kq || !kq.ok || window.parent === window) return;
      try {
        window.parent.postMessage(
          { type: "AWORD:NOP", code: assignment.code, name: studentName }, "*");
      } catch (_) { /* trang mẹ khó tính thì thôi, việc nộp đã xong rồi */ }
    }).catch(() => {});
    return giao;
  };
  // ⭐ Đợt 445 (02/10/2026) — BÁO TRANG MẸ "ĐANG TRONG VÁN / ĐÃ RỜI VÁN": myLesson web (bai.html) giữ mọi khung act
  // đã mở tới khi rời trang ⇒ iPad cũ gánh 2–3 bản AWord + video bài giảng, Safari hết bộ nhớ là tải lại trang (ca
  // NTK9 LESSON 21). Trang mẹ chỉ gỡ khung nào đã báo `dangChoi:false` — gỡ giữa ván là mất lượt dở + tính "bỏ cuộc"
  // (Đợt 383/424). Chỉ là tin báo: không đổi gì trong game; không nhúng (parent === window) thì không bắn.
  // HS đặc biệt không có `playLog` ⇒ không báo ⇒ trang mẹ để nguyên khung như trước.
  const baoVanChoTrangMe = (dangChoi) => {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({ type: "AWORD:VAN", code: assignment.code, dangChoi: !!dangChoi }, "*");
    } catch (_) { /* trang mẹ khó tính thì thôi */ }
  };
  startGame(app, activity, {
    session: {
      playerName: studentName,
      className: className || "",
      endOptions: assignment.endOptions || {},
      // ⭐ Đợt 424 — tấm "Start Again quá sớm" đang mở ⇒ engine hoãn lối vào thẳng ván (Start again) tới khi em đóng.
      choVaoVan: () => dangMo(),
      // ⭐⭐ Đợt 468 (thầy chốt 05/10/2026) — ÉP LÀM HẾT BÀI: chưa từng đạt 100% ở act này ⇒ ☰ ẩn ("an");
      // đã đạt 100% ⇒ ☰ có nhưng mở ra đồng hồ vẫn chạy ("chay"). Phụ huynh (`db=1`) giữ như cũ.
      // Cờ 100% = `daDat100` của bo-cuoc.js (Đợt 456: ghi khi làm hết đạt điểm tối đa, hoặc đọc bảng máy chủ).
      cheDoMenu: () => (dacBiet ? "" : (daDat100(khoaBC) ? "chay" : "an")),
      // ⭐⭐ Đợt 469 — LÀM TIẾP lượt dở (xem khối đầu `khoaLT`). Engine: nhãn nút START · lấy trạng thái ván ĐÚNG một
      // lần lúc dựng (begin) · gửi trạng thái mới sau mỗi câu trả lời.
      lamTiepNhan: () => { const s = xetLamTiep(); return s && s.tpl ? { daLam: s.tpl.daLam, tong: s.tpl.tong } : null; },   // Đợt 489 — hỏi lại được
      layLamTiep: () => {
        const s = lamTiepDung; lamTiepDung = null;
        return s && s.tpl ? { tpl: s.tpl, timeCost: s.timeCost || 0, daChoiMs: Date.now() - s.batDau } : null;
      },
      luuLamTiep: (t) => { luuLuot(t); },
      // What the screenshot fallback board prints (engine side, Đợt 246).
      meta: { assignmentTitle: assignment.title || "", code: assignment.code },

      // ⭐ Đợt 257 — TRANG NHÚNG BÁO "EM VỪA NỘP XONG" CHO TRANG MẸ: bài mở trong
      // iframe của myLesson web (&nhung=1) thì sau khi server XÁC NHẬN đủ hai
      // document, bắn postMessage {type:'AWORD:NOP', code, name} lên window.parent
      // — bên đó nghe để tự làm mới leaderboard của đúng act (một lượt đọc, khỏi
      // chờ cache 60s). Payload toàn dữ liệu vốn công khai (mã bài + tên trên
      // bảng điểm) nên target '*'; trang mẹ tự lọc theo origin của CHÍNH TA.
      // Không nhúng (mở tab thường, parent === window) thì không bắn gì.
      // ⛔ Chỉ bắn khi kq.ok — nộp treo/hỏng mà báo là bảng bên kia làm mới vô ích.
      submit: ({ score, total, timeMs, review }) => {
        if (dacBiet) {
          // KHÔNG queueAttempt(): entry đó rơi vào outbox CHUNG cho mọi lượt chơi
          // trên máy, và flushOutbox() (dòng ~45, chạy ở MỌI lần mở trang) sẽ âm
          // thầm gửi nó lên sau vào ĐÚNG kho điểm ta đang tránh. Ghi qua kho RIÊNG
          // `sendSpecialAttempt` — xem chú thích ⛔ đầy đủ ở core/assignments.js.
          attempt = { attemptId: "", score: Math.round(score) | 0,
                      total: Math.round(total) | 0, timeMs: Math.round(timeMs) | 0 };
          return sendSpecialAttempt({ code: assignment.code, studentName,
                                      score, total, timeMs });
        }
        attempt = queueAttempt({ code: assignment.code, studentName, ma, score, total, timeMs, review });
        return baoNopChoTrangMe(sendAttempt(attempt));
      },
      retrySubmit: () => {
        if (dacBiet) return attempt
          ? sendSpecialAttempt({ code: assignment.code, studentName,
                                 score: attempt.score, total: attempt.total,
                                 timeMs: attempt.timeMs })
          : Promise.resolve({ ok: false });
        return attempt ? baoNopChoTrangMe(sendAttempt(attempt)) : Promise.resolve({ ok: false });
      },
      attemptId: () => attempt ? attempt.attemptId : "",

      // ⭐⭐ Đợt 366 (thầy chốt 22/09/2026) — NHẬT KÝ LƯỢT CHƠI cho dashboard myLesson đo
      // tổng thời gian luyện: engine gọi start() lúc vào ván, beat() mỗi phút, end() lúc
      // Game Complete, leave() khi rời ván dở. Mỗi lượt một tài liệu, ghi đè — xem
      // `beatPlayLog` (core/assignments.js). HS ĐẶC BIỆT (phụ huynh) KHÔNG ghi — kho đó
      // đo lớp, không đo phụ huynh. `pagehide` bên dưới gửi nhịp cuối bằng keepalive.
      playLog: dacBiet ? null : {
        start: ({ mode, again, mistakes, diemNay, baiLamNay, trangThaiNay }) => {
          // ⭐ Đợt 469 — ván đầu tiên của trang có lượt dở đang giữ ⇒ LÀM TIẾP: mượn lại danh tính của lượt cũ.
          const vanDau = lamTiepXet;
          if (!mistakes) xetLamTiep();   // Đợt 489 — tab kia vừa đóng ngay trước cú bấm
          lamTiepXet = false;
          const lt = (!mistakes && lamTiepCho) ? lamTiepCho : null;
          // 🔎 Đợt 490 — lý do của ván này (xem `ltMo`): làm tiếp ⇒ giữ lý do gốc của lượt + ">tiep"; ván đầu không làm tiếp ⇒
          // tình trạng LÚC BẤM (đọc lại kho) + lúc mở + localStorage; ván sau trong cùng trang (Start again…) ⇒ "sau".
          let lyDo = "";
          if (lt) lyDo = ((lt.lt || "?") + ">tiep").slice(-60);
          else if (vanDau && !mistakes) {
            const s2 = docLuot(khoaLT);
            const bam = !s2 ? "khong-co" : s2.vet !== vetDe ? "vet" : !s2.tpl ? "khong-tpl" : tabKhacDangLam(khoaLT) ? "tab-khac" : "bo-qua";
            lyDo = (bam + "|mo:" + ltMo + "|" + ltLs).slice(0, 60);
          } else if (!mistakes) lyDo = "sau";
          lamTiepCho = null;
          lamTiepDung = lt;
          playLog = { code: assignment.code, id: lt ? lt.logId : newPlayLogId(), name: studentName, ma, mode,
                      again: !!again, mistakes: !!mistakes, score: 0, total: 0, timeMs: lt ? Math.max(0, Date.now() - lt.batDau) : 0,
                      done: false, attemptId: "", createdAt: lt ? lt.createdAt : gioChuan(), batDau: lt ? lt.batDau : Date.now(),   // Đợt 422 — createdAt theo máy chủ, batDau đo thời lượng
                      activeMs: lt ? (lt.activeMs || 0) : 0,
                      // ⭐ Đợt 383 — mã lượt nếu lượt này phải nộp DỞ (nháp · keepalive · outbox dùng chung một mã)
                      // + hàm hỏi engine "điểm tới lúc này" (pagehide không chờ engine được).
                      nhapId: lt ? lt.nhapId : newAttemptId(), diemNay: typeof diemNay === "function" ? diemNay : null, daNopDo: false,
                      baiLamNay: typeof baiLamNay === "function" ? baiLamNay : null,   // Đợt 384
                      trangThaiNay: typeof trangThaiNay === "function" ? trangThaiNay : null,   // Đợt 469
                      lt: lyDo };   // 🔎 Đợt 490 — chẩn đoán làm tiếp
          attempt = null;   // ⭐ Đợt 383 — `attempt` của lượt TRƯỚC không được dính sang nhật ký lượt này
          if (hoatDong) hoatDong.dung();
          hoatDong = taoDoHoatDong(choMs, lt ? lt.activeMs : 0);
          if (!mistakes && !dacBiet) batSong();   // Đợt 469
          beatPlayLog(playLog);
          baoVanChoTrangMe(true);   // Đợt 445
        },
        beat: ({ timeMs }) => {
          if (!playLog || playLog.done) return;
          playLog.timeMs = timeMs;
          // ⭐ Đợt 383 — nháp lượt đang chơi (máy tắt ngang không kịp pagehide ⇒ lần mở sau gửi bù, xem assignments.js).
          if (!dacBiet && !playLog.mistakes && playLog.diemNay) {
            try {
              const d = playLog.diemNay();
              if (d && Number(d.score) >= 1 && !khongNopDo()) saveDraft({ code: assignment.code, studentName, ma, score: d.score, total: d.total,
                                                         timeMs: gioLuotDo(d.timeMs), review: [], doDang: true, attemptId: playLog.nhapId });   // Đợt 418 · Đợt 491
            } catch (e) { /* nháp chỉ là lưới an toàn */ }
          }
          if (hoatDong) {
            playLog.activeMs = hoatDong.doc();
            if (hoatDong.treo()) return;   // Đợt 380 — treo > 10 phút: khỏi ghi, số đã có trên kho không đổi
          }
          beatPlayLog(playLog);
        },
        end: ({ score, total, timeMs, review }) => {
          if (!playLog) return;
          dropDraft(playLog.nhapId);   // Đợt 383 — lượt đã tới đích, nháp hết việc
          if (!playLog.mistakes) { xoaLuot(khoaLT); tatSong(); }   // Đợt 469 — lượt xong: thôi giữ
          playLog.score = score; playLog.total = total; playLog.timeMs = timeMs; playLog.done = true;
          if (!dacBiet && !playLog.mistakes) {
            ghiXongVan(khoaBC);   // ⭐ Đợt 424 — làm HẾT ván ⇒ chuỗi bỏ cuộc về 0
            // ⭐ Đợt 456 — đạt 100% (điểm = số câu của đề) ⇒ từ nay em cày xếp hạng: bỏ hẳn tấm nhắc ở act này.
            if (Number(total) > 0 && Number(score) >= Number(total)) ghiDat100(khoaBC);
          }
          if (hoatDong) { playLog.activeMs = hoatDong.doc(); hoatDong.dung(); hoatDong = null; }
          playLog.attemptId = (playLog.mode === "submit" && attempt) ? attempt.attemptId : "";
          // ⭐ Đợt 384 — lượt KHÔNG nộp (Start with mistakes, 0 điểm) ⇒ bài làm vào practiceLog; lượt nộp đã có ở results.
          if (!playLog.attemptId && Array.isArray(review) && review.length) playLog.review = review;
          beatPlayLog(playLog);
          baoVanChoTrangMe(false);   // Đợt 445
        },
        leave: ({ timeMs, score, total, review }) => {
          if (!playLog || playLog.done) return;
          baoVanChoTrangMe(false);   // Đợt 445 — báo TRƯỚC: phần dưới có thể ném (đã bọc) nhưng tin này không được lỡ
          if (!playLog.mistakes) { xoaLuot(khoaLT); tatSong(); }   // Đợt 469 — em tự rời ván (Start again…) ⇒ lượt này bỏ thật
          playLog.timeMs = Math.max(playLog.timeMs, timeMs | 0);
          if (hoatDong) { playLog.activeMs = hoatDong.doc(); hoatDong.dung(); hoatDong = null; }
          // ⭐ Đợt 379 — START AGAIN giữa ván: engine gửi kèm "điểm tới lúc dừng" (total để 0 = lượt dở; dashboard lấy
          // mẫu số là số câu của act). Đợt 383: mọi lối rời ván đều gửi `score` (trừ ván Start with mistakes).
          if (score != null) playLog.score = Math.max(0, Math.round(score) | 0);
          // ⭐ Đợt 383 — điểm ≥ 1 ⇒ NỘP lượt dở ngay (trang còn sống: SDK có thử lại) + gắn attemptId vào nhật ký.
          if (score != null) nopLuotDo({ score, total, timeMs: timeMs | 0, review });
          else dropDraft(playLog.nhapId);
          if (!playLog.attemptId && Array.isArray(review) && review.length) playLog.review = review;   // Đợt 384 — lượt không nộp
          beatPlayLog(playLog, { keepalive: true });
          // ⭐ Đợt 424 — rời ván khi mới làm < 50% ⇒ một lần BỎ CUỘC; tới ngưỡng thì hiện tấm hướng dẫn NGAY (ván kế tiếp
          // chờ em đóng tấm — engine hỏi `session.choVaoVan`). Ván Start with mistakes / phụ huynh không tính.
          if (!dacBiet && !playLog.mistakes) {
            try {
              const n = ghiRoiVan({ ...khoaBC, tiLe: tiLeDaLam({ review, score, total }) });
              if (n) hienNhac({ lan: n, coShow: coShowBC });
            } catch (e) { /* tấm nhắc chỉ là phụ — không bao giờ làm hỏng việc rời ván */ }
          }
          playLog = null;
        }
      },

      // The class ranking: each student's BEST attempt, best score first and,
      // on a tie, the faster time (the teacher's rule).
      entries: async () => {
        if (dacBiet) {
          // KHÔNG đọc kho điểm chung (listScores) — phụ huynh không được thấy/
          // không được lọt vào bảng của lớp. Chỉ trả về ĐÚNG dòng của chính họ,
          // dựng thẳng từ lượt vừa chơi (không tốn lượt đọc nào).
          return attempt
            ? [{ name: studentName, score: attempt.score, total: attempt.total,
                 timeMs: attempt.timeMs, mine: true }]
            : [];
        }
        // 🔒 Đợt 432 (bảo mật S2) — gộp theo MÃ EM (dòng có `ma`; luật bắt mã đúng vé đăng nhập) và
        // hiện TÊN THẬT theo mã từ danh sách lớp: ghi điểm mang "tên bạn khác" không mạo danh được nữa.
        // Dòng không mã (cũ trước 22/9 / chơi tự do) vẫn gộp theo tên như trước.
        // 📉 Đợt 433 (30/9/2026, giảm lượt đọc) — đọc BẢNG ĐIỂM TỐT NHẤT do máy chủ giữ sẵn (hàm `bangDiem`,
        // `assignments/{code}/bang/tot`): 1 lượt đọc thay vì CẢ KHO scores (tới 800 dòng × 2 lần mỗi ván).
        // Mỗi mục = dòng tốt nhất của một em + `tens` (mọi cách viết tên đã gặp). Chưa có bảng / đọc hỏng ⇒
        // quay về đọc kho như cũ. Máy chủ cập nhật chậm 1–2s ⇒ tự chèn LƯỢT VỪA NỘP của chính em vào.
        // ⭐ Đợt 439 (myLesson khoá đọc người ngoài GĐ3) — bảng điểm chỉ đọc được bằng VÉ em (trang mẹ myLesson cấp) / phiên
        // thầy. Không đọc được (mở ngoài myLesson…) ⇒ chỉ hiện dòng của chính em, như phụ huynh — không báo lỗi.
        const dongToi = () => (attempt ? [{ name: studentName, score: attempt.score, total: attempt.total, timeMs: attempt.timeMs, mine: true }] : []);
        const [bang, tenMa] = await Promise.all([docBangDiem(assignment.code, ma).catch(() => null), tenTheoMa(ma)]);
        let rows;
        if (bang && bang.v === 1 && bang.em && typeof bang.em === "object") {
          rows = Object.values(bang.em).map(m => ({ name: m.ten, ma: m.ma || "", score: m.score, total: m.total,
            timeMs: m.timeMs, tens: Array.isArray(m.tens) && m.tens.length ? m.tens : [m.ten] }));
          if (attempt) rows.push({ name: studentName, ma, score: attempt.score, total: attempt.total, timeMs: attempt.timeMs });
        } else {
          try { rows = await listScores(assignment.code, undefined, ma); }
          catch (e) { return dongToi(); }
        }
        const tenCua = r => r.tens || [r.name];
        // Dòng CŨ không mã của một em đã có dòng mới mang mã ⇒ nhập vào nhóm mã đó, NHƯNG chỉ khi tên
        // trong dòng có mã TRÙNG tên thật của mã (danh sách lớp) — dòng ghi "tên bạn khác" không hút
        // được điểm cũ của bạn đó. (Đo 59n6v2: không nhập thì 1 em thành 2 dòng.)
        const tenVeMa = new Map();
        rows.forEach(r => {
          if (!r.ma) return;
          const k = chuanMaEm(r.ma), that = tenMa.get(k);
          if (that) tenCua(r).forEach(t => { if (nameKey(that) === nameKey(t)) tenVeMa.set(nameKey(t), "m:" + k); });
        });
        const khoa = r => (r.ma ? "m:" + chuanMaEm(r.ma) : (tenVeMa.get(nameKey(r.name)) || "n:" + nameKey(r.name)));
        const best = new Map(), names = new Map();
        rows.forEach(r => {
          const key = khoa(r);
          names.set(key, [...(names.get(key) || []), ...tenCua(r)]);
          const cur = best.get(key);
          if (!cur || rankCompare(r, cur) < 0) best.set(key, r);
        });
        const mineKey = ma ? "m:" + chuanMaEm(ma) : "n:" + nameKey(studentName);
        return [...best.entries()]
          .map(([key, r]) => ({
            name: (r.ma && tenMa.get(chuanMaEm(r.ma))) || prettiestName(names.get(key) || [r.name]),
            score: r.score, total: r.total, timeMs: r.timeMs,
            mine: key === mineKey
          }))
          .sort(rankCompare);
      }
    }
  });
  // ⭐ Đợt 424 — lần trước em bỏ cuộc bằng tải lại / đóng tab tới ngưỡng ⇒ hiện tấm hướng dẫn ngay khi mở bài.
  if (!dacBiet) { try { const n = layNhacCho(khoaBC); if (n) hienNhac({ lan: n, coShow: coShowBC }); } catch (e) {} }
  // ⭐ Đợt 456 — đã đạt 100% ở MÁY KHÁC? Hỏi bảng điểm tốt nhất của máy chủ một lần cho mỗi act/máy (1 lượt đọc).
  // Chạy nền, lỗi/không có thì thôi (lần sau hỏi lại). Chỉ trang có mã em (phụ huynh `db=1` không nhắc nên khỏi hỏi).
  if (!dacBiet && ma && canKiemMayChu(khoaBC)) {
    docBangDiem(assignment.code, ma).then(bang => {
      if (bang && bang.v === 1 && bang.em && typeof bang.em === "object") {
        const k = chuanMaEm(ma);
        const m = Object.values(bang.em).find(x => x && chuanMaEm(x.ma) === k);
        if (m && Number(m.total) > 0 && Number(m.score) >= Number(m.total)) { ghiDat100(khoaBC); return; }
      }
      ghiDaKiem(khoaBC);
    }).catch(() => {});
  }
}
