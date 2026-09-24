// =============================================================
// play.js — THE STUDENT PAGE (play.html?g=<assignment code>)
//
// Deliberately a separate page from the teacher's app:
//   * it never imports core/store.js, so the teacher's library cannot even be
//     reached from here — a student only ever sees the one assigned act;
//   * it never asks anyone to sign in. Open the link, type a name, play.
//
// Flow (Đợt 246):  link -> "Enter your name" -> PRACTICE or SUBMIT -> the game
//   PRACTICE  nothing leaves this page — review + Start with mistakes only.
//   SUBMIT    the play uploads in the background the moment the game ends
//             (queueAttempt/sendAttempt below), and the big SUBMIT HOMEWORK
//             button on the end screen waits for the server's confirmation.
// Students may play as many times as they like; every SUBMIT attempt is recorded.
// =============================================================

import { startGame } from "./core/engine.js";
import { el } from "./core/utils.js";
import {
  getAssignment, queueAttempt, sendAttempt, flushOutbox,
  listScores, isLate, nameKey, prettiestName, rankCompare,
  sendSpecialAttempt,  // myLesson "HỌC SINH ĐẶC BIỆT" — kho điểm RIÊNG, xem assignments.js
  newPlayLogId, beatPlayLog   // Đợt 366 — kho LƯỢT LUYỆN practiceLog (thời gian mọi lượt, cả bỏ dở)
} from "./core/assignments.js";
import { ensureTemplate } from "./core/registry.js";
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
function taoDoHoatDong(choMs) {
  let activeMs = 0, lanCham = Date.now(), lucTick = Date.now(), timer = null;
  const cham = () => { lanCham = Date.now(); };
  const tick = () => {
    if (!timer) return;   // đã dừng: số chốt, không cộng thêm
    const t = Date.now(), d = t - lucTick; lucTick = t;
    if (document.visibilityState !== "visible") return;
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
  try {
    assignment = await getAssignment(code);
  } catch (e) {
    return showMessage("No internet connection", "Check your connection and open the link again.");
  }
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

function showMessage(title, sub) {
  const wrap = shell();
  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", title));
  if (sub) card.append(el("div", "aw-login-sub", sub));
  wrap.append(card, footer());
}

function showNameScreen(assignment) {
  const wrap = shell();
  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", assignment.activityTitle || assignment.title || "Ready to play"));
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

// ---------------- the game ----------------
async function play(assignment, studentName, className, studentMa) {
  const ma = String(studentMa || "");   // Đợt 367 — mã em, rỗng khi không qua myLesson
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
      "Check your connection and open the link again.");
  }

  app.innerHTML = "";
  // ⭐⭐ myLesson "HỌC SINH ĐẶC BIỆT" (thầy Andrew chốt 09/09/2026) — phụ huynh
  // luyện bài CÙNG con qua trang nhúng của myLesson, mang cờ `&db=1`. Chơi được,
  // nhưng KHÔNG được ghi vào kho điểm chung của lớp (không tính lượt nộp, không
  // vào leaderboard/kết quả của thầy) và màn kết thúc CHỈ được thấy đúng dòng của
  // CHÍNH mình — xem `submit`/`retrySubmit`/`entries` bên dưới.
  const dacBiet = new URLSearchParams(location.search).get("db") === "1";
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
  // ⛔ Đóng tab/đổi trang: engine KHÔNG kịp gọi leave(), nên tự tính "đã chơi bao lâu" theo
  // đồng hồ tường từ mốc `batDau` (đo thật 22/09: gửi lại gói cũ thì thiếu cả phút cuối).
  window.addEventListener("pagehide", () => {
    if (!playLog || playLog.done) return;
    if (hoatDong) playLog.activeMs = hoatDong.doc();
    playLog.timeMs = Math.max(playLog.timeMs, Date.now() - playLog.batDau);
    beatPlayLog(playLog, { keepalive: true });
  });
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
  startGame(app, activity, {
    session: {
      playerName: studentName,
      className: className || "",
      endOptions: assignment.endOptions || {},
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
        start: ({ mode, again, mistakes }) => {
          playLog = { code: assignment.code, id: newPlayLogId(), name: studentName, ma, mode,
                      again: !!again, mistakes: !!mistakes, score: 0, total: 0, timeMs: 0,
                      done: false, attemptId: "", createdAt: Date.now(), batDau: Date.now(), activeMs: 0 };
          if (hoatDong) hoatDong.dung();
          hoatDong = taoDoHoatDong(choMs);
          beatPlayLog(playLog);
        },
        beat: ({ timeMs }) => {
          if (!playLog || playLog.done) return;
          playLog.timeMs = timeMs;
          if (hoatDong) {
            playLog.activeMs = hoatDong.doc();
            if (hoatDong.treo()) return;   // Đợt 380 — treo > 10 phút: khỏi ghi, số đã có trên kho không đổi
          }
          beatPlayLog(playLog);
        },
        end: ({ score, total, timeMs }) => {
          if (!playLog) return;
          playLog.score = score; playLog.total = total; playLog.timeMs = timeMs; playLog.done = true;
          if (hoatDong) { playLog.activeMs = hoatDong.doc(); hoatDong.dung(); hoatDong = null; }
          playLog.attemptId = (playLog.mode === "submit" && attempt) ? attempt.attemptId : "";
          beatPlayLog(playLog);
        },
        leave: ({ timeMs, score }) => {
          if (!playLog || playLog.done) return;
          playLog.timeMs = Math.max(playLog.timeMs, timeMs | 0);
          if (hoatDong) { playLog.activeMs = hoatDong.doc(); hoatDong.dung(); hoatDong = null; }
          // ⭐ Đợt 379 — START AGAIN giữa ván: engine gửi kèm "điểm tới lúc dừng" (total để 0 = lượt dở; dashboard lấy
          // mẫu số là số câu của act). Các lối rời ván khác không gửi `score` ⇒ giữ 0 như cũ.
          if (score != null) playLog.score = Math.max(0, Math.round(score) | 0);
          beatPlayLog(playLog, { keepalive: true });
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
        const rows = await listScores(assignment.code);
        const best = new Map(), names = new Map();
        rows.forEach(r => {
          const key = nameKey(r.name);
          names.set(key, [...(names.get(key) || []), r.name]);
          const cur = best.get(key);
          if (!cur || rankCompare(r, cur) < 0) best.set(key, r);
        });
        const mineKey = nameKey(studentName);
        return [...best.entries()]
          .map(([key, r]) => ({
            name: prettiestName(names.get(key) || [r.name]),
            score: r.score, total: r.total, timeMs: r.timeMs,
            mine: key === mineKey
          }))
          .sort(rankCompare);
      }
    }
  });
}
