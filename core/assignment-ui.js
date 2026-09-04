// =============================================================
// ASSIGNMENT UI — everything the TEACHER sees around assignments:
//
//   openAssignmentSetup(act)   the "Set assignment" form  (title/deadline/end-of-game)
//   openAssignmentShare(a)     the link + QR to hand out
//   assignmentBar(a, onOpen)   the long strip shown under the stage, one per assignment
//   openAssignmentDetail(a)    the big report: summary · leaderboard · per-student detail
//
// All popups share one dim+blur backdrop (`.aw-as-dim`). Class names are
// prefixed `.aw-as-` so they can never collide with the in-game frame classes
// (.aw-topbar / .aw-iconbtn / .aw-navbtn) — see APP_MASTER mục 9.
// =============================================================

import { el, copyText } from "./utils.js";
import { icons } from "./icons.js";
import { qrSvg, copyQrImage, downloadQrPng } from "./qr.js";
import {
  createAssignment, updateAssignment, trashAssignment, listResults, listScores,
  listAllAssignments, assignmentLink, classFolderFor, assignmentNameTaken,
  courseResultsFor, COURSE_RESULTS_NAME,
  assignmentsToArchive, hasNewResults, markAssignmentSeen,
  nameKey, prettiestName, rankCompare
} from "./assignments.js";
import { listFolders, pathTo, createFolder } from "./store.js";
// ⭐ Đợt 250 — hand an act out as ANOTHER game, and know which games can
// hold its content. Same two functions the in-game "Change template"
// button uses, so there is exactly one converter in the app.
import { switchTargets, convertActivity } from "./convert.js";
import { TEMPLATES, templateLabel, templateIcon } from "./catalog.js";
// ⭐ Đợt 250 — the teacher's own class rolls, for the Class field's picker.
import { listClasses } from "./classes.js";
import { ensureTemplate } from "./registry.js";
import { getDefaultOptions, buildOptionsControls } from "./settings.js";
// Đợt 211 — splits an options object into the keys that say WHICH CONTENT is
// played (contentMode / contentVariant / voiceVariant / contentSet, plus the
// optVer stamp) and the rest. Already the app's own name for that category —
// see VIEW_SELECTOR_KEYS in core/content-view.js.
// ⭐ Đợt 252 — `activeVariant`/`variantLabel`: WHICH CLUE SET the class is being
// handed (ENG1 · VI1 …). myLesson prints it beside the template on the teacher's
// own row, so `onCreated` has to report it — see the note on that callback.
import { splitViewOptions, activeVariant, variantLabel, contentSetsOf } from "./content-view.js";
// Đợt 245 — the Edit form converts an old assignment's penalties onto today's
// scale before showing them, and stamps the result. See openAssignmentEdit.
import { migrateActivityOptions, OPT_VER } from "./options-migrate.js";

// =============================================================
// HOMEWORK OPTIONS (Đợt C, 15/8/2026) — the bảng Options shown on both the
// "Set assignment" and "Edit assignment" forms. `draft` is edited IN PLACE
// (same contract as core/settings.js's buildOptionsControls); the caller
// reads it back when the form is submitted. Deliberately its OWN block, apart
// from the act's own PRACTICE/HOMEWORK content switch — the teacher's rule
// (APP_MASTER mục 0a, Đợt C): "HAI CÔNG TẮC RỜI NHAU".
//
// ⭐⭐ Đợt 245 — `act` is passed through now, so the panel can also SHOW which
// content is being handed out (the PRACTICE/HOMEWORK row and the clue-set half
// of the Text/Voice row). Đợt 211 already made the assignment carry those four
// keys; this is what lets the teacher SEE and CHANGE them. Only `act.content`
// is read, and only to name things — nothing here writes to the act.
// ⚠️ `kind: "homework"` also drops the dead "Show answers at end" switch: on
// this form the tick-box in the "At the end of the game" row above is the one
// the pupil's machine obeys. See core/options-panel.js for the whole story.
// ⚠️ Đợt 250 — the "Options" LABEL is gone: the bordered block this is appended
// into carries the name on its edge now (see `block()`), and two names for one
// box is exactly the clutter thầy asked to remove. Only the Edit form still
// calls this; the Set form builds its own, rebuildable version inline because
// it has to survive a change of template.
function buildHomeworkOptionsField(body, activityType, draft, act = null) {
  const host = el("div", "aw-as-optshost");
  host.append(el("div", "aw-as-optsload", "Loading options…"));
  body.append(host);
  ensureTemplate(activityType).then(tpl => {
    if (!host.isConnected) return;   // the form was closed while this loaded
    host.innerHTML = "";
    host.append(buildOptionsControls(tpl, draft, { kind: "homework", act }));
  }).catch(() => {
    if (!host.isConnected) return;
    host.innerHTML = "";
    host.append(el("div", "aw-as-optsload", "This game's options could not be loaded."));
  });
}

// ---- tiny shared helpers ---------------------------------------------------

// A plain down-caret for the Class picker button. Local on purpose: it is
// the only chevron in the app, so it does not earn a slot in core/icons.js.
const CARET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg>`;

// ⭐ Đợt 250 (thầy) — A BORDERED BLOCK WITH A NAME ON ITS EDGE.
// "mỗi phần phải có viền xung quanh để mắt nhìn phân biệt được 2 khu."
// Used by both assignment forms so they never drift apart visually.
function block(legend) {
  const b = el("div", "aw-as-block2");
  if (legend) b.append(el("div", "aw-as-block2-legend", escapeText(legend)));
  return b;
}
function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDuration(ms) {
  const s = Math.round((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// "24.7" — day.month, no year, no leading zeros (used in the suggested title).
function fmtDateShort(ms) {
  const d = new Date(ms);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

// Swap out just the CLASS token at the very start of a title, keeping
// whatever comes after it untouched — so editing the Class field updates
// the title live without disturbing anything the teacher typed by hand.
// classTokenOf() in assignments.js reads titles the same way (first run of
// non-space/underscore characters), so the two stay in agreement.
function replaceClassToken(title, newClass) {
  const m = String(title || "").match(/^([^\s_]*)([\s_]*)([\s\S]*)$/);
  if (!m) return newClass;
  return newClass + m[2] + m[3];
}

// A <input type="datetime-local"> wants "YYYY-MM-DDTHH:MM" in LOCAL time —
// toISOString() would shift it by the timezone, so build the string by hand.
function toLocalInput(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}


// After a new assignment lands in a class folder, tuck any sibling made on an
// earlier day into that class's "DONE" subfolder (finding it by name, or
// creating it, only once it is actually needed). Best-effort: a failure here
// must never stop the assignment the teacher just created from opening.
async function archiveOlderSiblings(folderId, assignment) {
  if (!folderId) return;   // no class folder chosen -> nothing to file away
  const siblings = (await listAllAssignments())
    .filter(a => (a.folderId ?? null) === folderId && a.code !== assignment.code);
  const stale = assignmentsToArchive(siblings, assignment.createdAt);
  if (!stale.length) return;
  const folders = await listFolders("results");
  let done = folders.find(f => f.parentId === folderId &&
    String(f.name || "").trim().toLowerCase() === "done");
  if (!done) done = await createFolder("results", folderId, "DONE");
  await Promise.all(stale.map(a => updateAssignment(a.code, { folderId: done.id })));
}

function flash(msg) {
  const t = el("div", "aw-as-flash", escapeText(msg));
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add("is-on"));
  setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 250); }, 2200);
}

// ⭐ Đợt 250 — MODALS NOW STACK (the Set assignment form opens a class picker
// and a template picker ON TOP of itself). Two things had to become
// stack-aware for that to be safe:
//   · ESCAPE — every open modal used to listen on `document`, so one press
//     closed the picker AND the form under it. Only the TOP one answers now.
//   · the backdrop click already scoped itself (`e.target === dim`), because
//     each modal has its own `dim`; nothing to do there.
// The comment that used to say "one modal at a time" was describing a habit,
// not a mechanism — nothing ever enforced it.
const modalStack = [];
function openModal(size, build) {
  const dim = el("div", "aw-as-dim");
  const modal = el("div", "aw-as-modal" + (size ? " aw-as-" + size : ""));
  // ⭐ Đợt 254 — chế độ NHÚNG (?giao=…&khung=1, body.aw-khung-mode): pop-up GỐC
  // (mở lúc chưa có pop-up nào — form Set assignment, rồi màn QR sau START) vẽ
  // PHẲNG TRÀN MÉP cho khớp vỏ thẻ trắng myLesson vẽ quanh webview; picker xếp
  // CHỒNG (class/template) giữ nguyên dạng thẻ nổi. Đánh dấu NGAY LÚC MỞ vì lúc
  // đóng stack đã bị splice, không suy ngược được nữa.
  const khungGoc = document.body.classList.contains("aw-khung-mode") && modalStack.length === 0;
  if (khungGoc) dim.classList.add("aw-as-goc");
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey);
    const at = modalStack.indexOf(close);
    if (at >= 0) modalStack.splice(at, 1);
    // ⭐ Đợt 254 — pop-up GỐC đóng mà KHÔNG có pop-up gốc mới mọc lên ngay thì
    // báo myLesson đóng cả pop-up bên đó. setTimeout(0) là bắt buộc: đường START
    // đóng form rồi mở màn QR NGAY trong cùng một lượt (close() →
    // openAssignmentShare()), phải nhường cho lượt mở-liền kịp đẩy vào stack —
    // không thì marker bắn nhầm và myLesson nuốt mất màn QR.
    if (khungGoc) setTimeout(() => {
      if (!modalStack.length) { try { console.log("MYACT:AW:GIAO:DONG"); } catch (_) {} }
    }, 0);
    dim.classList.remove("is-on");
    setTimeout(() => dim.remove(), 200);     // fade out; opacity only (see rule 12)
  };
  modalStack.push(close);
  // ⚠️ Only the modal on TOP of the stack answers Escape (Đợt 250).
  const onKey = e => {
    if (e.key !== "Escape") return;
    if (modalStack[modalStack.length - 1] !== close) return;
    close();
  };
  dim.onclick = e => { if (e.target === dim) close(); };
  document.addEventListener("keydown", onKey);
  build(modal, close);
  dim.append(modal);
  document.body.append(dim);
  requestAnimationFrame(() => dim.classList.add("is-on"));
  return close;
}

// ⭐ Đợt 255 — TÊN VIẾT TẮT CỦA TEMPLATE, để nối vào ĐUÔI tiêu đề bài giao
// (thầy chốt quy tắc tên 24/8 khuya: "B2B_24.8_WORDS LSA2-S2.T1.P3-4-5 — WP1
// — ANAGRAM"). GSQUIZ và ANAGRAM là hai tên thầy nêu; các tên còn lại đặt cùng
// nếp (một chữ nén, đổi thì đổi Ở BẢNG NÀY, một chỗ duy nhất).
const TPL_SHORT = {
  quiz: "QUIZ",            anagram: "ANAGRAM",     find_the_match: "MATCH",
  type_the_answer: "TYPE", open_the_box: "OPENBOX", true_false: "TF",
  gameshow: "GSQUIZ",      maze_chase: "MAZE",     whack_a_mole: "WHACK",
  flying_fruit: "FRUIT",   balloon_pop: "BALLOON", crossword: "CROSSWORD",
  unjumble: "UNJUMBLE",    speaking_cards: "SPCARDS",
  running_word: "RUNWORD", running_team: "RUNTEAM", speaking: "SPEAKING",
};
export function tplShortName(type) {
  return TPL_SHORT[type]
    || String(templateLabel(type) || type || "").toUpperCase().replace(/[^A-Z0-9]+/g, "");
}
// Thay/nối đuôi " — <TPL>" của tiêu đề. `cu` = đuôi đang đứng (null nếu chưa
// có). ⚠️ Tôn trọng tay thầy: tiêu đề KHÔNG kết thúc bằng đuôi cũ (thầy đã sửa
// tay) thì để nguyên, không đắp thêm.
export function datDuoiTemplate(title, cu, moi) {
  const t = String(title || "");
  const duoiMoi = " — " + moi;
  if (t.endsWith(duoiMoi)) return t;
  if (cu === null || cu === undefined) return t + duoiMoi;
  const duoiCu = " — " + cu;
  if (t.endsWith(duoiCu)) return t.slice(0, t.length - duoiCu.length) + duoiMoi;
  return t;
}

function headRow(title, close) {
  const head = el("div", "aw-as-head");
  head.append(el("div", "aw-as-title", escapeText(title)));
  const x = el("button", "aw-as-x", icons.close);
  x.type = "button"; x.title = "Close"; x.onclick = close;
  head.append(x);
  return head;
}

function button(label, cls, onClick) {
  const b = el("button", "aw-as-btn" + (cls ? " " + cls : ""), label);
  b.type = "button";
  b.onclick = onClick;
  return b;
}

// A round icon-only button (toolbar of the report popup) — same idea as the
// close (x) button, just with any icon and a tooltip for its label.
function iconButton(icon, title, onClick) {
  const b = el("button", "aw-as-iconbtn", icon);
  b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
  b.onclick = onClick;
  return b;
}

// =============================================================
// 1. SET ASSIGNMENT — the setup form
// =============================================================
// ⭐ Đợt 247 — `lop`: myLesson (qua bridge `giaoBai`) đưa sẵn tên lớp; ô Class
// và chữ đầu của tiêu đề được điền trước, thầy vẫn sửa được như thường.
//
// ⭐⭐⭐ Đợt 250 (thầy, 24/8/2026) — QUY HOẠCH LẠI CẢ FORM. Thầy giao 5 việc:
//   · bỏ TẤT CẢ các dòng hướng dẫn ("hoàn toàn không cần 1 dòng nào");
//   · Class có nút chọn lấy từ danh sách lớp trong Settings;
//   · Class và Deadline nằm CHUNG một dòng (cả hai đều ngắn);
//   · hai khu có VIỀN riêng — bài giao ở trên, Options ở dưới;
//   · thêm ô CHỌN TEMPLATE, nằm ngay trong Options, ở tầng trên của ô chọn
//     bộ nghĩa (xem buildContentSwitchRow trong core/options-panel.js).
//
// ⛔⛔ ĐỔI TEMPLATE **KHÔNG PHẢI** ĐỔI MỘT CHỮ `type`. Mỗi game giữ nội dung
// theo một hình dạng khác nhau (Quiz: `questions` · Find the match: `pairs` ·
// Anagram: `items`…), nên phải đi qua `convertActivity()` của core/convert.js —
// đúng bộ máy nút "Change template" trong game vẫn dùng. Ba hệ quả bắt buộc
// nhớ, cả ba đều đã cắn ở đợt khác:
//   1. THỨ TỰ: chọn bộ nghĩa TRƯỚC, chuyển đổi SAU. `toRecords()` gọi
//      `resolveActivity()` để ép phẳng act tích hợp xuống ĐÚNG bộ nghĩa đang
//      chọn (Đợt 145). Chuyển trước rồi mới chọn ⇒ lớp chọn VI1 nhận về ENG1.
//   2. DÂY NỐI: act chuyển đổi mang id "conv_…" dùng một lần. Lưu id đó là bài
//      giao **mất liên kết vĩnh viễn** với act trong thư viện. Vì vậy
//      `createAssignment` nhận thêm `sourceAct` (Đợt 250, core/assignments.js).
//   3. OPTIONS: mỗi game một bộ options riêng, nên đổi template là dựng lại
//      `hwDraft` từ mặc định homework của game MỚI (thầy chốt), chỉ bê sang 4
//      khoá SELECTOR (bộ nghĩa · TEXT/VOICE · nửa practice/homework).
//
// ⚠️ Việc chuyển đổi làm ở lúc bấm START, không phải lúc bấm chọn template:
// giữ act gốc nguyên vẹn suốt form là thứ giữ cho hàng ENG1/ENG2/VI1 vẫn còn để
// chọn (act đã chuyển đổi không còn bộ nghĩa nào cả).
// ⭐⭐ Đợt 252 — HAI CỬA NHỎ CHO myLesson (chỉ THÊM, không đổi gì của đường cũ):
//   · `tieuDe` — tiêu đề bài giao điền sẵn. myLesson đã biết lớp + ngày + tên
//     bài nên đặt được một cái tên đúng nếp của thầy ngay từ đầu; thầy vẫn sửa
//     tay được như thường. Không truyền ⇒ y hệt trước (tự dựng từ Class + ngày
//     + tên act).
//   · `onCreated(assignment, chiTiet)` — THAM SỐ THỨ HAI LÀ MỚI. Bài giao lưu
//     xuống Firestore không mang cái tên ĐỌC ĐƯỢC của bộ nghĩa ("ENG1") lẫn của
//     template ("QUIZ"): `activityType` là mã máy (`quiz`), còn bộ nghĩa nằm lẫn
//     trong `activity.options` và **biến mất hẳn** khi act được chuyển đổi
//     (`convertActivity` gỡ sạch `variants`). Vì vậy hai chữ đó phải tính Ở ĐÂY,
//     lúc act gốc còn nguyên, rồi báo ra ngoài. Người gọi cũ bỏ qua tham số này
//     là chuyện thường — không ai vỡ.
export function openAssignmentSetup(act, { onCreated, lop, tieuDe } = {}) {
  openModal("optswide", (modal, close) => {
    modal.append(headRow("Set assignment", close));
    const body = el("div", "aw-as-body");
    const err = el("div", "aw-as-err", "");

    // ---------- KHỐI TRÊN: những gì chỉ bài giao mới có ----------
    const top = block("Assignment");

    // Class + Deadline share one line: neither is ever long, and stacking them
    // cost a whole row of height for nothing (thầy).
    const line = el("div", "aw-as-line");

    const classCell = el("div", "aw-as-cell");
    classCell.append(el("label", "aw-as-label", "Class"));
    const classPick = el("div", "aw-as-pick");
    const classInput = el("input", "aw-as-input");
    classInput.type = "text";
    classInput.maxLength = 20;
    classInput.placeholder = "e.g. A1A";
    // ⭐ Đợt 250 — the classes the teacher keeps in Settings ▸ Classes
    // (core/classes.js). Typing a brand-new name by hand still works exactly as
    // before: this button is a shortcut, never a gate.
    const classBtn = el("button", "aw-as-pickbtn", CARET);
    classBtn.type = "button";
    classBtn.title = "Pick one of your classes";
    classBtn.onclick = () => openClassPicker(name => {
      classInput.value = name;
      classInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    classPick.append(classInput, classBtn);
    classCell.append(classPick);

    const dlCell = el("div", "aw-as-cell");
    dlCell.append(el("label", "aw-as-label", "Deadline"));
    const dl = el("div", "aw-as-deadline");
    const dlInput = el("input", "aw-as-input aw-as-date");
    dlInput.type = "datetime-local";
    dlInput.disabled = true;
    const noDl = el("label", "aw-as-check");
    const noDlBox = el("input"); noDlBox.type = "checkbox"; noDlBox.checked = true;
    noDlBox.onchange = () => {
      dlInput.disabled = noDlBox.checked;
      if (!noDlBox.checked && !dlInput.value) {
        dlInput.value = toLocalInput(Date.now() + 7 * 24 * 3600 * 1000);   // a week from now
      }
    };
    noDl.append(noDlBox, document.createTextNode("No deadline"));
    dl.append(noDl, dlInput);
    dlCell.append(dl);

    line.append(classCell, dlCell);
    top.append(line);

    // --- title — starts as "<Class> — <today, d.m> — <act title>"; typing in
    // the Class field above keeps just that leading word in step, live.
    // ⭐ Đợt 255 — ô "Show answers" dời lên CÙNG HÀNG với nhãn "Assignment
    // title", nép bên phải (thầy: ít dùng, để đó cho tiết kiệm diện tích) —
    // hàng .aw-as-optrow cũ dưới đáy khối bỏ hẳn.
    const titleCell = el("div", "aw-as-cell");
    const titleHead = el("div", "aw-as-titlehead");
    titleHead.append(el("label", "aw-as-label", "Assignment title"));
    const answersWrap = el("label", "aw-as-check");
    const cbAnswers = el("input"); cbAnswers.type = "checkbox"; cbAnswers.checked = false;
    answersWrap.append(cbAnswers, document.createTextNode("Show answers"));
    titleHead.append(answersWrap);
    titleCell.append(titleHead);
    const titleInput = el("input", "aw-as-input");
    titleInput.type = "text";
    titleInput.maxLength = 80;
    titleInput.value = classInput.value + " — " + fmtDateShort(Date.now()) + " — " + (act.title || "Untitled");
    titleCell.append(titleInput);
    top.append(titleCell);

    let classTouched = false;
    classInput.oninput = () => {
      classTouched = true;
      titleInput.value = replaceClassToken(titleInput.value, classInput.value);
      err.textContent = "";
    };
    // ⭐ Đợt 247 — lớp điền sẵn từ myLesson (bridge `giaoBai`). Đặt
    // `classTouched` để cú đoán theo thư mục của act (khối act.parentId dưới)
    // không ghi đè lên.
    if (lop) {
      classTouched = true;
      classInput.value = String(lop).slice(0, 20);
      titleInput.value = replaceClassToken(titleInput.value, classInput.value);
    }
    // ⭐ Đợt 252 — tiêu đề myLesson đưa sang. Đặt SAU khối `lop` ở trên: ở đó
    // `replaceClassToken` viết lại chữ đầu của tiêu đề, chạy sau là nó xoá mất
    // cái tên thầy đã đặt bên myLesson.
    if (tieuDe) titleInput.value = String(tieuDe).slice(0, 80);

    // ⭐ Đợt 255 — ĐUÔI TEMPLATE trong tiêu đề (thầy chốt quy tắc tên): tiêu đề
    // tự động kết thúc bằng " — <TPL viết tắt>" (QUIZ · ANAGRAM · GSQUIZ…),
    // đổi template trong form là đuôi tự đổi theo (xem templatePicker.onPick).
    // Đuôi hiện hành ghi vào `dataset.tpl` để myLesson (capNhatTenBaiGiao) khi
    // bơm lại phần đầu tiêu đề biết giữ đuôi — ⛔ đừng bỏ dataset này.
    // ⚠️ Thầy sửa tay tiêu đề làm mất đuôi thì datDuoiTemplate tôn trọng, không
    // đắp lại. Gán .value vượt maxlength=80 là chuyện được phép (maxlength chỉ
    // chặn phím gõ) — đuôi không bao giờ bị xén nửa chừng.
    let tplDuoi = tplShortName(act.type);
    titleInput.value = datDuoiTemplate(titleInput.value, null, tplDuoi);
    titleInput.dataset.tpl = tplDuoi;

    // --- end of game — ⭐ Đợt 246 (thầy): ONE tick left (Show answers, governs
    // both modes' menus). ⭐ Đợt 255 — cái ô đó nay dựng Ở TRÊN, cạnh nhãn
    // "Assignment title" (xem titleHead); hàng riêng dưới đáy khối bỏ hẳn.
    body.append(top);

    // ---------- KHỐI DƯỚI: Options ----------
    //
    // ⭐⭐ Đợt 211 (20/8/2026, thầy) — THE ACT'S OWN CHOICE OF WHAT TO PLAY IS
    // LAID OVER THE DEFAULTS. Thầy: "trong options chọn text nhưng act vẫn phát
    // âm thanh và có nút loa để bấm nghe voice ở phía sau."
    //
    // Đợt C started this draft from the Settings defaults ALONE, and those hold
    // five general fields only (BUILTIN_DEFAULTS in core/settings.js) — no
    // `contentMode` among them. The Text/Voice row then "writes nothing until
    // the teacher actually taps", and TEXT is lit from the start, so an
    // untouched form stored NOTHING: the assignment reached the pupil with
    // `contentMode` unset, which is the AUTO branch of voiceView() — speaker
    // button AND autoplay, the exact thing Text mode exists to remove. Two more
    // went the same way (the clue set, and the PRACTICE/HOMEWORK half).
    //
    // ⚠️ THIS DOES NOT BREAK "HAI CÔNG TẮC RỜI NHAU" (thầy, Đợt C). That rule is
    // about the OPTIONS BUNDLE — timer, shuffling, penalties — which still
    // starts from the homework bucket and is still decided per assignment. The
    // four keys taken from the act are SELECTORS: not settings, but the NAME of
    // the content being handed out.
    // ⭐ Đợt 245 — and the panel SHOWS those four selectors as real controls.
    // ⭐ Vấn đề 5 (thầy chốt, ~5/9/2026) — a NEW assignment for an act with both
    // PRACTICE and HOMEWORK halves (a quiz's two question sets) starts on
    // HOMEWORK, not PRACTICE. Scoped to THIS form only (creating an assignment):
    // `contentSetsOf` reads straight off the act's own content, which never
    // changes across a template swap, so it is worked out once, here.
    // ⛔ Does not touch: the editor's own tab default, "Edit assignment" (an
    // EXISTING assignment keeps whichever half it was actually created with),
    // or the in-game Options panel (not creating an assignment at all).
    const coNuaHomework = (contentSetsOf(act.content) || []).includes("homework");
    let playType = act.type;                    // which GAME the class will play
    let hwDraft = { ...getDefaultOptions(act.type, "homework"),
                    ...splitViewOptions(act.options).selectors };
    if (coNuaHomework) hwDraft.contentSet = "homework";

    const optBlock = block("Options");
    const optsHost = el("div", "aw-as-optshost");
    optBlock.append(optsHost);
    body.append(optBlock);

    // Đợt 250 — the panel is REBUILT (not patched) whenever the template
    // changes: every control in it belongs to one template's own option set, so
    // there is nothing worth keeping across the swap. `optsSeq` throws away the
    // answer of a load the teacher has already moved past.
    let optsSeq = 0;
    const templatePicker = {
      label: () => templateLabel(playType),
      icon: () => templateIcon(icons, playType),
      onPick: () => openTemplatePicker(act, playType, type => {
        if (type === playType) return;
        playType = type;
        // ⚠️ Selectors carried, settings NOT (thầy chốt: "Về mặc định của game
        // mới"). A number named the same in two games is not the same number.
        hwDraft = { ...getDefaultOptions(playType, "homework"),
                    ...splitViewOptions(hwDraft).selectors };
        // Vấn đề 5 — a template swap rebuilds the draft from scratch, so the
        // HOMEWORK default has to be re-applied here too (same act, same sets).
        if (coNuaHomework) hwDraft.contentSet = "homework";
        // ⭐ Đợt 255 — đuôi template trong tiêu đề đổi theo (tôn trọng bản thầy
        // đã sửa tay: mất đuôi cũ thì thôi, không đắp).
        const duoiMoi = tplShortName(playType);
        titleInput.value = datDuoiTemplate(titleInput.value, tplDuoi, duoiMoi);
        tplDuoi = duoiMoi;
        titleInput.dataset.tpl = duoiMoi;
        renderOptions();
      })
    };
    function renderOptions() {
      const seq = ++optsSeq;
      optsHost.innerHTML = "";
      optsHost.append(el("div", "aw-as-optsload", "Loading options…"));
      ensureTemplate(playType).then(tpl => {
        if (!optsHost.isConnected || seq !== optsSeq) return;
        optsHost.innerHTML = "";
        // ⚠️ `act`, always the ORIGINAL — it is what NAMES the clue sets. The
        // converted act has none (see the header note), so handing the played
        // type's act here would empty the very row the teacher chooses from.
        optsHost.append(buildOptionsControls(tpl, hwDraft, { kind: "homework", act, templatePicker }));
      }).catch(() => {
        if (!optsHost.isConnected || seq !== optsSeq) return;
        optsHost.innerHTML = "";
        optsHost.append(el("div", "aw-as-optsload", "This game's options could not be loaded."));
      });
    }
    renderOptions();

    // --- where it will be filed in Results (worked out from the title).
    // ⚠️ Đợt 250 — the LINE that said so is gone (thầy: no prose), but the
    // folder is still worked out here: START needs `folderId`, and the
    // duplicate-name check needs `allAssignments`.
    // ⭐ Đợt 287 — an act in COURSES files under <lesson>/results/<class> of
    // its OWN tree, so the folder list read here is that tree's, not Results'.
    const inCourses = act.root === "courses";
    let folders = [], allAssignments = [];
    Promise.all([listFolders(inCourses ? "courses" : "results"), listAllAssignments()])
      .then(([f, a]) => { folders = f; allAssignments = a; })
      .catch(() => { /* offline: it just files at the top of Results */ });
    // Best-effort guess for the Class field: the name of the folder this act
    // already sits in (Activities), when the teacher hasn't typed one yet.
    // ⛔ Not in Courses: there the parent folder is a LESSON ("Lesson 3"), and
    // that name in the Class field would be a class no roll has.
    if (act.parentId && !inCourses) {
      pathTo(act.parentId).then(chain => {
        if (classTouched || classInput.value || !chain.length) return;
        classInput.value = chain[chain.length - 1].name || "";
        titleInput.value = replaceClassToken(titleInput.value, classInput.value);
      }).catch(() => { /* no guess, teacher types it */ });
    }
    titleInput.oninput = () => { err.textContent = ""; };

    body.append(err);
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    const back = button("BACK", "", close);
    const start = button("START", "aw-as-primary", async () => {
      if (!classInput.value.trim()) {
        err.textContent = "Please enter the class.";
        classInput.focus();
        return;
      }
      // ⭐ Đợt 287 — WHERE IT IS FILED. Results tree: the old rule (the class
      // token of the title, anywhere in Results, top level when none). Courses
      // tree: ONLY <lesson>/results/<Class field> beside the act — missing ⇒ the
      // form offers to create it (thầy 03/9: hỏi xin tạo, không đẩy về Results).
      // Nothing in Courses ever falls back to the Results tree.
      let folderId;
      if (inCourses) {
        const cls = classInput.value.trim();
        const r = courseResultsFor(act.parentId, folders, cls);
        if (!r.lessonId) {
          err.textContent = "This activity is not inside a lesson folder. Move it into Courses / <course> / <lesson> first.";
          return;
        }
        if (!r.classFolder) { offerCreate(r, cls); return; }
        folderId = r.classFolder.id;
      } else {
        folderId = classFolderFor(titleInput.value, folders);
      }
      await doStart(folderId);
    });

    // Courses only — the lesson has no results/<class> folder yet: say so, and
    // offer to make it ("results" first if that is missing too, then the class)
    // and start in one tap. Typing in Class/Title clears the offer (their
    // oninput handlers blank `err`), so a changed class is looked up afresh.
    function offerCreate(r, cls) {
      err.innerHTML = "";
      const path = (r.resultsFolder ? "" : COURSE_RESULTS_NAME + " / ") + cls;
      err.append(el("span", null,
        `This lesson has no “${COURSE_RESULTS_NAME} / ${escapeText(cls)}” folder yet. `));
      const mk = el("button", "aw-as-linkbtn", `Create “${escapeText(path)}” and start`);
      mk.type = "button";
      mk.onclick = async () => {
        mk.disabled = true; mk.textContent = "Creating folder...";
        try {
          let results = r.resultsFolder;
          if (!results) results = await createFolder("courses", r.lessonId, COURSE_RESULTS_NAME);
          const clsFolder = await createFolder("courses", results.id, cls);
          folders = await listFolders("courses");
          err.textContent = "";
          await doStart(clsFolder.id);
        } catch (e) {
          err.textContent = e.message || "Could not create the folder.";
        }
      };
      err.append(mk);
    }

    async function doStart(folderId) {
      if (assignmentNameTaken(allAssignments, { folderId, title: titleInput.value })) {
        err.textContent = "An assignment with this name is already filed there. Please change the name.";
        return;
      }
      start.disabled = back.disabled = true;
      start.textContent = "Creating...";
      err.textContent = "";
      try {
        const deadline = noDlBox.checked || !dlInput.value ? null : new Date(dlInput.value).getTime();
        // ⭐⭐ Đợt 250 — HAND IT OUT AS ANOTHER GAME. See the header note for why
        // this order is not negotiable: selectors onto the ORIGINAL act first,
        // convert second, and the original act's identity travels separately as
        // `sourceAct` so the assignment stays tied to the library act.
        // ⭐ Đợt 252 — act gốc ĐÃ ĐEO bộ chọn của form. Dựng MỘT LẦN ở đây rồi
        // dùng cho cả hai việc: đọc tên bộ nghĩa (cho `onCreated`) và chuyển
        // đổi template. `activeVariant` phải đọc trên act GỐC — bản chuyển đổi
        // không còn `variants` nên hỏi nó thì luôn ra rỗng.
        const stagedGoc = { ...act, options: { ...(act.options || {}), ...splitViewOptions(hwDraft).selectors } };
        const boKey = activeVariant(stagedGoc);
        let playAct = act, sourceAct = null;
        if (playType !== act.type) {
          playAct = await convertActivity(stagedGoc, playType);
          sourceAct = act;
        }
        const assignment = await createAssignment(playAct, {
          title: titleInput.value,
          deadline,
          folderId,
          sourceAct,
          // leaderboard/startAgain stay `true` in the stored shape (Đợt 246):
          // the new end screens no longer read them, but every document keeps
          // the same three keys so nothing else ever meets a half-shaped one.
          endOptions: {
            leaderboard: true,
            showAnswers: cbAnswers.checked,
            startAgain: true
          },
          options: hwDraft
        });
        // ⭐ Đợt 287 — no DONE filing in Courses (thầy 03/9): a course keeps
        // every lesson's assignments flat under results/<class>.
        if (!inCourses) {
          try { await archiveOlderSiblings(folderId, assignment); }
          catch (e) { console.warn("AWord: could not move older assignments into DONE:", e.message); }
        }
        close();
        openAssignmentShare(assignment);
        onCreated?.(assignment, {
          bo: boKey || "",                                        // "eng1" (mã máy)
          boTen: boKey ? variantLabel(act.content, boKey) : "",    // "ENG1"  (chữ đọc được)
          mauType: playType,                                      // "quiz"
          mauTen: templateLabel(playType) || "",                  // "Quiz"
        });
      } catch (e) {
        start.disabled = back.disabled = false;
        start.textContent = "START";
        err.textContent = e.message || "Could not create the assignment.";
      }
    }
    actions.append(back, start);
    modal.append(actions);
    setTimeout(() => classInput.focus(), 30);
  });
}

// ---- Đợt 250: the two little pickers the Set form opens ---------------------
//
// Both are ordinary `openModal` popups stacked ON TOP of the Set form. That is
// only safe because of the Escape stack in openModal (see there): without it a
// single press of Escape would close the picker AND the form underneath it.

// The teacher's own classes (Settings ▸ Classes, core/classes.js). Never a
// gate: the Class field stays free text — this only saves the typing.
function openClassPicker(onPick) {
  openModal("", (modal, close) => {
    modal.append(headRow("Your classes", close));
    const body = el("div", "aw-as-body");
    const host = el("div", "aw-as-picklist");
    host.append(el("div", "aw-as-optsload", "Loading…"));
    body.append(host);
    modal.append(body);
    listClasses().then(list => {
      if (!host.isConnected) return;
      host.innerHTML = "";
      if (!list.length) {
        host.append(el("div", "aw-as-optsload", "No classes in Settings yet."));
        return;
      }
      list.forEach(c => {
        const b = el("button", "aw-as-pickitem", escapeText(c.name || ""));
        b.type = "button";
        b.onclick = () => { close(); onPick(c.name || ""); };
        host.append(b);
      });
    }).catch(() => {
      if (!host.isConnected) return;
      host.innerHTML = "";
      host.append(el("div", "aw-as-optsload", "Could not load your classes."));
    });
  });
}

// WHICH GAME this class will play. Two filters, both real:
//   · `switchTargets(act)` — the games whose data shape can hold this act's
//     content (core/convert.js). The rest are shown DIMMED rather than hidden,
//     so the teacher can see the game exists and simply does not fit.
//   · `tpl.noAssignment` — Đợt 245's rule: Speaking cards sends back no result
//     at all, and the two racing games report on a TEAM, not on a pupil. Dimmed
//     too, carrying the template's own sentence as the reason.
// ⚠️ Those flags live INSIDE each template module, so they have to be loaded to
// be read — hence the short wait. `ensureTemplate` caches, so it is slow once.
function openTemplatePicker(act, currentType, onPick) {
  openModal("optswide", (modal, close) => {
    modal.append(headRow("Choose a template", close));
    const body = el("div", "aw-as-body");
    const host = el("div", "aw-as-tplhost");
    host.append(el("div", "aw-as-optsload", "Loading…"));
    body.append(host);
    modal.append(body);

    const fits = new Set(switchTargets(act).map(t => t.type));
    fits.add(act.type);                       // an act's own game always fits it
    const built = TEMPLATES.filter(t => t.built);
    Promise.all(built.map(t =>
      (fits.has(t.type)
        ? ensureTemplate(t.type).then(tpl => tpl.noAssignment || null).catch(() => null)
        : Promise.resolve(null)
      ).then(no => ({ type: t.type, label: t.label, no }))
    )).then(rows => {
      if (!host.isConnected) return;
      host.innerHTML = "";
      const grid = el("div", "aw-tpl-grid");
      rows.forEach(t => {
        const isCurrent = t.type === currentType;
        const why = !fits.has(t.type) ? t.label + " — doesn't fit this content" : (t.no || "");
        const enabled = !isCurrent && !why;
        const item = el("div", "aw-tpl-item" + (isCurrent ? " is-current" : enabled ? "" : " is-soon"));
        item.append(el("span", "aw-tpl-icon", templateIcon(icons, t.type)),
                    el("span", "aw-tpl-name", escapeText(t.label)));
        if (enabled) item.onclick = () => { close(); onPick(t.type); };
        else if (!isCurrent) { item.title = why; item.onclick = () => toast(why); }
        grid.append(item);
      });
      host.append(grid);
    }).catch(() => {
      if (!host.isConnected) return;
      host.innerHTML = "";
      host.append(el("div", "aw-as-optsload", "Could not load the templates."));
    });
  });
}

// =============================================================
// 2. SHARE — the link + QR handed to students
// =============================================================
export function openAssignmentShare(assignment) {
  openModal("", (modal, close) => {
    modal.append(headRow("Assignment created", close));
    const body = el("div", "aw-as-body");
    const url = assignmentLink(assignment.code, assignment.title);

    body.append(el("div", "aw-as-sub", escapeText(assignment.title)));
    body.append(el("label", "aw-as-label", "Student link"));

    const linkRow = el("div", "aw-as-linkrow");
    const linkInput = el("input", "aw-as-input");
    linkInput.type = "text"; linkInput.readOnly = true; linkInput.value = url;
    linkInput.onclick = () => linkInput.select();
    linkRow.append(linkInput, button("Copy link", "aw-as-primary", async () => {
      flash(await copyText(url) ? "Link copied" : "Press Ctrl+C to copy");
      linkInput.select();
    }));
    body.append(linkRow);

    body.append(el("label", "aw-as-label", "QR code"));
    const qrWrap = el("div", "aw-as-qrwrap");
    const qrBox = el("div", "aw-as-qr");
    qrBox.innerHTML = qrSvg(url);
    const qrBtns = el("div", "aw-as-qrbtns");
    qrBtns.append(
      button("Copy QR image", "", async () => {
        try { await copyQrImage(url, 700); flash("QR image copied"); }
        catch (e) { flash("This browser cannot copy images — use Download"); }
      }),
      button("Download QR", "", () => {
        downloadQrPng(url, `QR ${assignment.title || assignment.code}.png`.replace(/[\\/:*?"<>|]/g, "-"));
        flash("QR saved to your Downloads");
      })
    );
    qrWrap.append(qrBox, qrBtns);
    body.append(qrWrap);
    // ⚠️ Đợt 250 — the line "Students open this link, type their name and play.
    // No sign-in needed." lived here. Gone with the rest of the prose (thầy:
    // "hoàn toàn không cần 1 dòng hướng dẫn nào cả"). ⛔ The sentence in
    // confirmTrashAssignment below is NOT the same kind of thing and STAYS: it
    // is the question being asked, not advice — a delete confirmation with no
    // words in it would be a trap.
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    actions.append(button("DONE", "aw-as-primary", close));
    modal.append(actions);
  });
}

// =============================================================
// 2b. EDIT an assignment that is already out there
// Reachable from BOTH the Results card and the strip under the act, because
// there is only ONE assignment document behind them.
// =============================================================
export function openAssignmentEdit(assignment, { onSaved } = {}) {
  openModal("optswide", (modal, close) => {
    modal.append(headRow("Edit assignment", close));
    const body = el("div", "aw-as-body");

    // ⭐ Đợt 250 — laid out like the Set assignment form (two bordered blocks,
    // no prose), so the two forms never read as two different apps.
    // ⛔ NO TEMPLATE PICKER HERE, and this is a decision, not an omission (thầy
    // chốt qua AskUserQuestion 24/8): by the time Edit is open the link may
    // already be out and pupils may already have played. Swapping the game
    // underneath them would leave one leaderboard holding two scales of score,
    // with no honest way to compare the halves.
    const top = block("Assignment");

    top.append(el("label", "aw-as-label", "Assignment title"));
    const titleInput = el("input", "aw-as-input");
    titleInput.type = "text"; titleInput.maxLength = 80;
    titleInput.value = assignment.title || "";
    top.append(titleInput);

    top.append(el("label", "aw-as-label", "Deadline"));
    const dl = el("div", "aw-as-deadline");
    const dlInput = el("input", "aw-as-input aw-as-date");
    dlInput.type = "datetime-local";
    const noDl = el("label", "aw-as-check");
    const noDlBox = el("input"); noDlBox.type = "checkbox";
    noDlBox.checked = !assignment.deadline;
    dlInput.disabled = noDlBox.checked;
    if (assignment.deadline) dlInput.value = toLocalInput(assignment.deadline);
    noDlBox.onchange = () => {
      dlInput.disabled = noDlBox.checked;
      if (!noDlBox.checked && !dlInput.value) dlInput.value = toLocalInput(Date.now() + 7 * 24 * 3600 * 1000);
    };
    noDl.append(noDlBox, document.createTextNode("No deadline"));
    dl.append(noDl, dlInput);
    top.append(dl);

    // ⭐ Đợt 246 — one tick left, same reasoning as the Set assignment form.
    // ⚠️ Đợt 250 — its label went with the rest of the prose.
    const opts = el("div", "aw-as-optrow");
    const end = assignment.endOptions || {};
    const answersWrap = el("label", "aw-as-check");
    const cbAnswers = el("input"); cbAnswers.type = "checkbox";
    cbAnswers.checked = end.showAnswers !== false;
    answersWrap.append(cbAnswers, document.createTextNode("Show answers"));
    opts.append(answersWrap);
    top.append(opts);

    // Đợt 250 — "Status" was a label over a tick that already says what it does,
    // and the line under it ("Closing keeps every score…") was one more sentence
    // thầy does not want. Both gone; the tick moved up into this block.
    const closedWrap = el("label", "aw-as-check");
    const cbClosed = el("input"); cbClosed.type = "checkbox"; cbClosed.checked = !!assignment.closed;
    closedWrap.append(cbClosed, document.createTextNode("Closed — students can open the link but not play"));
    top.append(closedWrap);
    body.append(top);

    // --- homework options (Đợt C) — starts from what THIS assignment already
    // carries (never the Settings default: an assignment already out to
    // students keeps its own choice until the teacher changes it here).
    //
    // ⭐⭐⭐ Đợt 245 — CONVERT BEFORE SHOWING, STAMP WHEN SAVING. Both halves,
    // in that order, or the fix is worse than the bug.
    //
    // Đợt 211 taught the CREATE path to stamp `optVer` on the snapshot, because
    // core/options-migrate.js runs again on the pupil's machine and an unstamped
    // assignment gets its penalties rescaled a SECOND time ("Points off 30"
    // reaching the child as 100). The EDIT path was never taught the same thing,
    // so an assignment given out before 20/8/2026 stayed exposed — and the
    // remedy Đợt 211 itself recommends ("mở Edit assignment bấm nút TEXT rồi
    // SAVE") walks straight through this door.
    //
    // ⛔⛔ STAMPING ALONE WOULD BE A SILENT DOWNGRADE. An old assignment stores
    // `pointsOff: 3` meaning "3 out of 5" — the pupil's machine turns that into
    // 60 out of 100, which is what the class has actually been getting. Stamp it
    // without converting and that 3 freezes as "3 out of 100", i.e. very nearly
    // Off: the teacher changes the title, presses Save, and the penalty quietly
    // evaporates. It also made the form LIE — the slider drew 3 while the game
    // ran 60. So the draft is migrated FIRST, which both fixes the display and
    // makes the stamp truthful.
    //
    // ⚠️ A COPY is migrated, never `assignment.activity` itself. Nothing is
    // written to Firestore until the teacher presses SAVE, and a teacher who
    // opens Edit and presses BACK must leave the document exactly as it was.
    // ⚠️ Already-stamped assignments (everything from Đợt 211 on) pass through
    // untouched — that is what `optVer` is for. Re-running is the whole design.
    const hwSeed = migrateActivityOptions({
      type: assignment.activityType,
      optVer: assignment.activity?.optVer,
      options: { ...(assignment.activity?.options || {}) }
    });
    const hwDraft = hwSeed.options;
    const optBlock = block("Options");
    buildHomeworkOptionsField(optBlock, assignment.activityType, hwDraft, assignment.activity);
    body.append(optBlock);

    const err = el("div", "aw-as-err", "");
    body.append(err);
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    const back = button("BACK", "", close);
    const save = button("SAVE", "aw-as-primary", async () => {
      const title = titleInput.value.trim();
      if (!title) { err.textContent = "Please give the assignment a name."; return; }
      save.disabled = back.disabled = true;
      save.textContent = "Saving...";
      err.textContent = "";
      try {
        const all = await listAllAssignments();
        if (assignmentNameTaken(all, { folderId: assignment.folderId ?? null, title, exceptCode: assignment.code })) {
          throw new Error("An assignment with this name is already in the same folder.");
        }
        const patch = {
          title,
          deadline: noDlBox.checked || !dlInput.value ? null : new Date(dlInput.value).getTime(),
          endOptions: { leaderboard: true, showAnswers: cbAnswers.checked, startAgain: true },
          closed: cbClosed.checked,
          // Dot-path (Đợt C): rewrites ONLY `activity.options`, leaving the rest
          // of the frozen snapshot (content, theme, ...) untouched. Confirmed
          // against the published rules: `allow update: if isTeacher()` covers
          // any field — see docs/08-FIREBASE-SETUP.md.
          "activity.options": hwDraft,
          // ⭐⭐⭐ Đợt 245 — THE OTHER HALF OF THE optVer FIX (see the long note
          // where hwDraft is seeded). These values have just come off today's
          // Options panel, on today's scale, so the stamp is true by
          // construction — the same reasoning snapshotOf() uses on the create
          // path. Without it the pupil's machine rescales them all over again.
          // ⚠️ CURRENT version, never `assignment.activity.optVer` — copying the
          // old stamp forward would say "already converted" about numbers that
          // have only just been converted a line above.
          "activity.optVer": OPT_VER
        };
        await updateAssignment(assignment.code, patch);
        // keep the open popups in step — `Object.assign` cannot resolve the
        // dot-path key above onto the nested `assignment.activity` itself.
        Object.assign(assignment, { title: patch.title, deadline: patch.deadline,
          endOptions: patch.endOptions, closed: patch.closed });
        // ⚠️ Đợt 245 — the stamp comes along, or a SECOND Edit in the same
        // sitting would re-migrate the values it just saved (the popup object is
        // what that next Edit seeds itself from, not a fresh Firestore read).
        assignment.activity = { ...(assignment.activity || {}), options: hwDraft, optVer: OPT_VER };
        close();
        flash("Assignment updated");
        onSaved?.(assignment);
      } catch (e) {
        save.disabled = back.disabled = false;
        save.textContent = "SAVE";
        err.textContent = e.message || "Could not save.";
      }
    });
    actions.append(back, save);
    modal.append(actions);
  });
}

// Send an assignment to the Results recycle bin, after asking.
export function confirmTrashAssignment(assignment, { onDone } = {}) {
  openModal("", (modal, close) => {
    modal.append(headRow("Delete assignment", close));
    const body = el("div", "aw-as-body");
    body.append(el("div", "aw-as-note",
      `“${escapeText(assignment.title || assignment.code)}” moves to the Results recycle bin. ` +
      `The student link stops working, but every score is kept — you can restore it at any time.`));
    const err = el("div", "aw-as-err", "");
    body.append(err);
    modal.append(body);
    const actions = el("div", "aw-as-actions");
    const cancel = button("CANCEL", "", close);
    const del = button("DELETE", "aw-as-primary", async () => {
      del.disabled = cancel.disabled = true;
      del.textContent = "Deleting...";
      try {
        await trashAssignment(assignment.code);
        close();
        flash("Moved to the recycle bin");
        onDone?.();
      } catch (e) {
        del.disabled = cancel.disabled = false;
        del.textContent = "DELETE";
        err.textContent = e.message || "Could not delete.";
      }
    });
    actions.append(cancel, del);
    modal.append(actions);
  });
}

// Shared little actions so the Results cards and the strips behave identically.
export async function copyAssignmentLink(assignment) {
  const url = assignmentLink(assignment.code, assignment.title);
  flash(await copyText(url) ? "Link copied" : url);
}
export async function copyAssignmentQr(assignment) {
  const url = assignmentLink(assignment.code, assignment.title);
  try { await copyQrImage(url, 700); flash("QR image copied"); }
  catch (e) { downloadQrPng(url, `QR ${assignment.code}.png`); flash("QR saved to your Downloads"); }
}
export { openAssignmentShare as openAssignmentShareAgain };

// =============================================================
// 3. The long strip under the stage — one per assignment
// =============================================================
export function assignmentBar(assignment, onOpen) {
  const bar = el("button", "aw-as-bar");
  bar.type = "button";
  bar.append(el("span", "aw-as-bar-ic", icons.assignment));
  bar.append(el("span", "aw-as-bar-name", escapeText(assignment.title || assignment.code)));
  const meta = el("span", "aw-as-bar-meta", escapeText(fmtDate(assignment.createdAt)));
  bar.append(meta);
  // a dot right after the date = students have handed in since you last looked
  if (hasNewResults(assignment)) {
    const dot = el("span", "aw-newdot aw-newdot-bar");
    dot.title = "New results";
    bar.append(dot);
  }
  bar.onclick = () => onOpen(assignment);
  return bar;
}

// =============================================================
// 4. DETAIL — the big report popup
// =============================================================
// `inAct: true` means the teacher is already looking at the activity this
// assignment came from — then "Open activity" simply closes the popup instead
// of opening a second copy of the same thing.
export function openAssignmentDetail(assignment, { onChanged, inAct = false } = {}) {
  // Opening the report IS seeing it: the red dot goes away from here on.
  const hadNews = hasNewResults(assignment);
  if (hadNews) {
    assignment.lastSeenAt = Date.now();
    markAssignmentSeen(assignment.code).then(() => onChanged?.());
  }

  openModal("wide", (modal, close) => {
    const url = assignmentLink(assignment.code, assignment.title);

    // ---- top strip: what this assignment is, plus the share buttons
    const top = el("div", "aw-as-top");
    const info = el("div", "aw-as-info");
    const titleEl = el("div", "aw-as-title", "");
    const metaEl = el("div", "aw-as-meta", "");
    info.append(titleEl, metaEl);
    drawHead();
    top.append(info);

    function drawHead() {
      titleEl.innerHTML = escapeText(assignment.title || assignment.code) +
        (assignment.closed ? ' <span class="aw-as-closed">CLOSED</span>' : "");
      const bits = [
        (assignment.activityType || "").toUpperCase(),
        "Given " + fmtDate(assignment.createdAt),
        assignment.deadline ? "Due " + fmtDate(assignment.deadline) : "No deadline"
      ];
      metaEl.textContent = bits.join("  ·  ");
    }

    // Delete is deliberately NOT here — from the report the only way to remove
    // an assignment is the ⁝ menu on its card in Results (main.js), so a stray
    // click in the report never destroys it by accident.
    const tools = el("div", "aw-as-toptools");
    tools.append(
      iconButton(icons.refresh, "Refresh", () => refresh()),
      iconButton(icons.link, "Copy link", async () => flash(await copyText(url) ? "Link copied" : url)),
      iconButton(icons.qr, "Copy QR", async () => {
        try { await copyQrImage(url, 700); flash("QR image copied"); }
        catch (e) { downloadQrPng(url, `QR ${assignment.code}.png`); flash("QR saved to your Downloads"); }
      }),
      iconButton(icons.openExternal, "Open activity", () => {
        if (inAct) return close();              // already there — just get out of the way
        const num = assignment.activityNum;
        const dir = location.pathname.replace(/[^/]*$/, "");
        const target = num != null ? `?a=${encodeURIComponent(num)}`
                                   : `?play=${encodeURIComponent(assignment.activityId || "")}`;
        window.open(`${location.origin}${dir}${target}`, "_blank");
      }),
      iconButton(icons.edit, "Edit", () => openAssignmentEdit(assignment, {
        onSaved: () => { drawHead(); onChanged?.(); }
      }))
    );
    const x = el("button", "aw-as-x", icons.close);
    x.type = "button"; x.title = "Close"; x.onclick = close;
    tools.append(x);
    top.append(tools);
    modal.append(top);

    const body = el("div", "aw-as-body aw-as-report");
    modal.append(body);
    refresh();

    function refresh() {
      body.innerHTML = "";
      body.append(el("div", "aw-as-loading", "Loading results..."));
      loadReport(assignment).then(rows => {
        body.innerHTML = "";
        body.append(summaryBlock(assignment, rows));
        body.append(leaderboardBlock(assignment, rows));   // Đợt 245 — needs the options to read the score right
        body.append(detailBlock(assignment, rows));
      }).catch(e => {
        // Never show "nobody has played" when the truth is "we could not ask" —
        // an empty report and a failed read look identical to the teacher otherwise.
        body.innerHTML = "";
        body.append(el("div", "aw-as-err", escapeText(e.message || "Could not load the results.")));
        body.append(el("div", "aw-as-note", "Check your internet connection, then press Refresh."));
      });
    }
  });
}

// ⭐⭐⭐ Đợt 245 (23/8/2026, thầy) — DOES `score` STILL MEAN "HOW MANY WERE RIGHT"?
//
// For a plain assignment it does, and the report has always read correctly. But
// the moment ANY penalty is switched on in the assignment's Options, `score` is
// the value AFTER deductions — so the report's two oldest columns started lying:
//   · "Correct"    printed the penalised score, not the tally.
//   · "Incorrect"  is computed `total − score`, which is arithmetic on two
//                  different units the moment they disagree. 9 right out of 10
//                  with "Points off 30" gives score −21, so `Math.max(0, …)`
//                  clamped it and the column read a confident, wrong "0".
// Gameshow is the extreme case: it scores by SPEED, so a play reads "1250/10".
//
// ⛔⛔ THE REAL TALLY IS NOT IN THE DATA AND CANNOT BE ADDED CHEAPLY. The
// in-game summary can show both because it holds `result.correct` in memory; the
// stored result cannot, because the keys of `results` are FIXED BY THE PUBLISHED
// SECURITY RULES (assignmentId, studentName, score, total, timeMs, review,
// createdAt — see the header of core/assignments.js). Adding `correct` means
// re-publishing the Firestore rules first, and until those rules are live EVERY
// submission would be rejected. Thầy chose the honest, no-migration option: stop
// printing a number the data cannot support, and rename what IS there.
//
// So: an assignment with a penalty reports SCORE, and drops the Incorrect
// column entirely rather than showing a made-up one. An assignment without one —
// the default on every act — is untouched, byte for byte, and still says
// Correct / Incorrect.
//
// ⚠️ Read off the assignment's OWN frozen options, not the library act's: the
// snapshot is what the class actually played, and the act may have been retuned
// since. Every penalty field in the app is listed here — `pointsOff` (the shared
// control), `minusAmount` (the older name Crossword / Type the answer /
// Whack-a-mole still write, the exact pair core/options-migrate.js warns about),
// `letterPenalty` (Anagram) and `timeCost` (the idle clock).
const PENALTY_KEYS = ["pointsOff", "minusAmount", "letterPenalty", "timeCost"];
function scoreIsPenalised(assignment) {
  // Gameshow never scores by tally at all — points for speed, whatever else is set.
  if (assignment.activityType === "gameshow") return true;
  const o = assignment.activity?.options || {};
  return PENALTY_KEYS.some(k => Number(o[k]) > 0);
}

// Merge the two collections: the teacher's full copies plus any public score row
// whose detailed copy did not make it (both are written with the same
// `createdAt`, which makes a reliable de-duplication key).
async function loadReport(assignment) {
  const [r1, r2] = await Promise.allSettled([
    listResults(assignment.code),
    listScores(assignment.code)
  ]);
  // If BOTH reads failed, say so loudly instead of reporting an empty class.
  if (r1.status === "rejected" && r2.status === "rejected") {
    throw new Error(r1.reason?.message || "Could not read the results.");
  }
  const results = r1.status === "fulfilled" ? r1.value : [];
  const scores = r2.status === "fulfilled" ? r2.value : [];
  const seen = new Set(results.map(r => `${nameKey(r.studentName)}|${r.createdAt}`));
  const extra = scores
    .filter(s => !seen.has(`${nameKey(s.name)}|${s.createdAt}`))
    .map(s => ({ studentName: s.name, score: s.score, total: s.total, timeMs: s.timeMs,
                 createdAt: s.createdAt, review: null }));

  return [...results, ...extra].map(r => ({
    name: r.studentName || "Player",
    key: nameKey(r.studentName),
    score: r.score || 0,
    total: r.total || 0,
    incorrect: Math.max(0, (r.total || 0) - (r.score || 0)),
    timeMs: r.timeMs || 0,
    createdAt: r.createdAt || 0,
    late: !!(assignment.deadline && r.createdAt > assignment.deadline),
    review: Array.isArray(r.review) ? r.review : null
  })).sort((a, b) => b.createdAt - a.createdAt);
}

function summaryBlock(assignment, rows) {
  const wrap = el("div", "aw-as-block");
  wrap.append(el("div", "aw-as-blockhead", "Summary"));
  const students = new Set(rows.map(r => r.key)).size;
  const stats = el("div", "aw-as-stats");
  // small label ON TOP, big number below — same tile for every stat here.
  const stat = (label, value) => {
    const s = el("div", "aw-as-stat");
    s.append(el("div", "aw-as-statl", label), el("div", "aw-as-statv", String(value)));
    return s;
  };
  stats.append(stat("Students", students), stat("Plays", rows.length));
  if (assignment.deadline) stats.append(stat("Late plays", rows.filter(r => r.late).length));
  if (rows.length) {
    const topScore = Math.max(...rows.map(r => r.score));
    const topRows = rows.filter(r => r.score === topScore);
    // ⭐ Đợt 245 — "12/20" is a TALLY out of a total, and it stops being one as
    // soon as a penalty is on (or the game is Gameshow, which scores by speed):
    // "1250/10" is not a fraction of anything. Drop the denominator rather than
    // print a meaningless one. See scoreIsPenalised() for the whole reasoning.
    stats.append(stat("Top Score",
      scoreIsPenalised(assignment) ? `${topScore}` : `${topScore}/${topRows[0].total}`));

    // Fastest among those who got the top score — that IS "top speed".
    const fastest = topRows.reduce((best, r) => (!best || r.timeMs < best.timeMs) ? r : best, null);
    stats.append(stat(`Top Speed - ${escapeText(fastest.name)}`, fmtDuration(fastest.timeMs)));
  }
  wrap.append(stats);
  if (!rows.length) wrap.append(el("div", "aw-as-note", "No student has played this assignment yet."));
  return wrap;
}

// Best attempt per student, ranked: more correct first, then faster.
// ⭐ Đợt 245 — takes the assignment now, only to ask scoreIsPenalised().
function leaderboardBlock(assignment, rows) {
  const wrap = el("div", "aw-as-block");
  wrap.append(el("div", "aw-as-blockhead", "Leaderboard"));
  if (!rows.length) return wrap;

  const best = new Map();
  rows.forEach(r => {
    const cur = best.get(r.key);
    if (!cur || rankCompare(r, cur) < 0) best.set(r.key, r);
  });
  const names = new Map();
  rows.forEach(r => { names.set(r.key, [...(names.get(r.key) || []), r.name]); });

  const penalised = scoreIsPenalised(assignment);
  const table = el("div", "aw-as-table aw-as-lb");
  table.append(row(["Rank", "Name", "Score", "Time"], true));
  [...best.values()].sort(rankCompare).forEach((r, i) => {
    // full marks -> the whole row is green; nothing right -> the whole row is red
    // ⚠️ Đợt 245 — BOTH tints are switched off once a penalty is on, not just
    // the fraction beside them. `score === total` is "full marks" only while
    // score is a tally: with points deducted it is unreachable, and `score === 0`
    // stops meaning "got nothing right" (it is just as easily 5 correct answers
    // with 5 points burnt off). A red row that accuses a child who did fine is
    // worse than no colour at all.
    const mark = penalised ? ""
               : r.total > 0 && r.score === r.total ? " is-perfect"
               : r.score === 0 ? " is-zero" : "";
    table.append(row([
      String(i + 1),
      prettiestName(names.get(r.key) || [r.name]),
      penalised ? `${r.score}` : `${r.score}/${r.total}`,
      fmtDuration(r.timeMs)
    ], false, mark));
  });
  wrap.append(table);
  return wrap;

  function row(cells, head, extra = "") {
    const tr = el("div", "aw-as-tr" + (head ? " is-head" : "") + extra);
    cells.forEach(c => tr.append(el("div", "aw-as-td", escapeText(c))));
    return tr;
  }
}

// Every attempt, sortable, and each row opens to show the answers given.
function detailBlock(assignment, rows) {
  const wrap = el("div", "aw-as-block aw-as-block-details");
  wrap.append(el("div", "aw-as-blockhead", "Details"));
  if (!rows.length) return wrap;

  // ⭐⭐ Đợt 245 — the two middle columns, told the truth. With no penalty on the
  // assignment (the default on every act) this is byte-for-byte the old list:
  // Correct + Incorrect. With one on, `score` is the PENALISED value, so
  // "Correct" would be a wrong label and "Incorrect" (`total − score`) a wrong
  // number — the column is dropped rather than filled with a guess, because the
  // real tally is not in the stored result at all. See scoreIsPenalised().
  const penalised = scoreIsPenalised(assignment);
  const COLS = [
    { key: "name", label: "Student", get: r => r.name.toLowerCase() },
    { key: "createdAt", label: "Submitted", get: r => r.createdAt },
    { key: "score", label: penalised ? "Score" : "Correct", get: r => r.score },
    ...(penalised ? [] : [{ key: "incorrect", label: "Incorrect", get: r => r.incorrect }]),
    { key: "timeMs", label: "Time", get: r => r.timeMs }
  ];
  let sortKey = "createdAt", asc = false;

  // ⚠️ Đợt 245 — the grid's column COUNT lives in CSS, so dropping a cell in JS
  // is only half the change (see `.aw-as-detail.is-nocorrect` in core/app.css).
  const table = el("div", "aw-as-table aw-as-detail" + (penalised ? " is-nocorrect" : ""));
  wrap.append(table);
  draw();
  return wrap;

  function draw() {
    table.innerHTML = "";
    const head = el("div", "aw-as-tr is-head");
    COLS.forEach(c => {
      const cell = el("div", "aw-as-td aw-as-sortable");
      cell.append(el("span", null, c.label));
      if (sortKey === c.key) cell.append(el("span", "aw-as-arrow", asc ? "▲" : "▼"));
      cell.onclick = () => {
        if (sortKey === c.key) asc = !asc; else { sortKey = c.key; asc = c.key === "name"; }
        draw();
      };
      head.append(cell);
    });
    table.append(head);

    const col = COLS.find(c => c.key === sortKey);
    const sorted = rows.slice().sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return asc ? cmp : -cmp;
    });

    sorted.forEach(r => {
      // full marks -> the whole row reads in green, same idea as the leaderboard
      // ⚠️ Đợt 245 — and switched off with a penalty on, for the same reason as
      // the leaderboard's two tints: `score === total` is not "full marks" once
      // points are being deducted, it is simply unreachable.
      const perfect = !penalised && r.total > 0 && r.score === r.total;
      const tr = el("div", "aw-as-tr aw-as-clickable" + (perfect ? " is-perfect" : ""));
      const nameCell = el("div", "aw-as-td");
      nameCell.append(el("span", "aw-as-caret", "▸"), el("span", null, escapeText(r.name)));
      if (r.late) nameCell.append(el("span", "aw-as-late", "LATE"));
      tr.append(nameCell);
      tr.append(
        el("div", "aw-as-td", escapeText(fmtDate(r.createdAt))),
        el("div", "aw-as-td", String(r.score))
      );
      // ⛔ The body must stay in step with COLS above — the table is a CSS grid
      // with a fixed column count (`.aw-as-detail` in core/app.css), so one extra
      // cell here does not overflow visibly, it shunts Time under the wrong
      // heading on every row. Same condition, written once, read twice.
      if (!penalised) tr.append(el("div", "aw-as-td", String(r.incorrect)));
      tr.append(el("div", "aw-as-td", fmtDuration(r.timeMs)));
      table.append(tr);

      // Collapsed by default; opening animates height+opacity smoothly instead
      // of an instant display:none/block jump cut.
      const detail = el("div", "aw-as-answers");
      detail.append(answersTable(r));
      table.append(detail);

      // Opening one student puts the popup in FOCUS MODE: that row and the
      // answers below it stay bright, everything else dims away so the teacher
      // reads one child's work without the rest of the page competing.
      tr.onclick = () => {
        const open = tr.classList.contains("is-open");
        closeAllRows();
        if (!open) {
          tr.classList.add("is-open");
          tr.querySelector(".aw-as-caret").textContent = "▾";
          detail.style.maxHeight = detail.scrollHeight + "px";
          detail.classList.add("is-open");
          setFocusMode(true, [tr, detail]);
        }
      };
    });

    function closeAllRows() {
      table.querySelectorAll(".aw-as-answers").forEach(d => { d.style.maxHeight = "0px"; d.classList.remove("is-open"); });
      table.querySelectorAll(".aw-as-tr.is-open").forEach(r => {
        r.classList.remove("is-open");
        const c = r.querySelector(".aw-as-caret");
        if (c) c.textContent = "▸";
      });
      setFocusMode(false);
    }

    // Dim everything except the pieces passed in.
    function setFocusMode(on, keep = []) {
      const modal = wrap.closest(".aw-as-modal");
      if (!modal) return;
      modal.classList.toggle("is-focus", on);
      modal.querySelectorAll(".aw-as-lit").forEach(x => x.classList.remove("aw-as-lit"));
      if (on) keep.forEach(x => x.classList.add("aw-as-lit"));
    }
  }
}

// One student's play, question by question.
function answersTable(r) {
  if (!r.review || !r.review.length) {
    return el("div", "aw-as-note", "No answer detail was saved for this play.");
  }
  const t = el("div", "aw-as-table aw-as-qa");
  const head = el("div", "aw-as-tr is-head");
  ["#", "Question", "Their answer", "Mark", "Answer"].forEach(h => head.append(el("div", "aw-as-td", h)));
  t.append(head);

  r.review.forEach((q, i) => {
    const right = q.answered && q.yourCorrect;
    const tr = el("div", "aw-as-tr");
    tr.append(
      el("div", "aw-as-td", String(i + 1)),
      el("div", "aw-as-td", escapeText(q.question || "")),
      el("div", "aw-as-td", escapeText(q.answered ? (q.yourText || "") : "No answer"))
    );
    const mark = el("div", "aw-as-td aw-as-mark" + (right ? " is-right" : " is-wrong"));
    mark.innerHTML = right ? icons.check : icons.cross;
    tr.append(mark);
    // the right answer is only worth showing when they did not get it
    tr.append(el("div", "aw-as-td", escapeText(right ? "" : (q.correctText || ""))));
    t.append(tr);
  });
  return t;
}
